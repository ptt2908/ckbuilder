//! Week 7 — Checkpoint 4.3: Types & Error Handling
//!
//! Practices algebraic data types (`struct`, data-carrying `enum`), `Option<T>`,
//! `Result<T, E>`, the `?` propagation operator, and exhaustive `match` / `if let`
//! using an embedded multi-channel ADC sensor packet decoder.

/// Maximum supported ADC multiplexer channel index (`0..=7`).
pub const MAX_CHANNEL_ID: u8 = 7;

/// Valid ADC voltage window in millivolts (`100 mV..=3300 mV`).
/// Values below 100 mV indicate a ground short; values above 3300 mV indicate rail saturation.
pub const MIN_VALID_MV: u16 = 100;
pub const MAX_VALID_MV: u16 = 3300;

/// Voltage thresholds in millivolts for warning and emergency shutdown modes.
pub const WARNING_THRESHOLD_MV: u16 = 2500;
pub const SHUTDOWN_THRESHOLD_MV: u16 = 3000;

/// Status register bitmasks.
pub const FLAG_STANDBY_BIT: u8 = 0b0000_0001;
pub const FLAG_HW_FAULT_MASK: u8 = 0b1111_0000;

/// Unvalidated raw telemetry packet read from a sensor bus.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RawPacket {
    pub channel_id: u8,
    pub seq: u16,
    pub raw_millivolts: u16,
    pub status_flags: u8,
}

/// Typed operational state of a verified sensor reading.
///
/// C/C++ note: Each enum variant can carry its own typed fields (like `std::variant`
/// in C++17, but with first-class compiler pattern matching). `Standby` carries no
/// temperature payload because ADC conversion is gated while in standby.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OperationalMode {
    Standby,
    Normal {
        temp_deci_c: i16,
    },
    Warning {
        temp_deci_c: i16,
        margin_to_shutdown_deci_c: i16,
    },
    EmergencyShutdown {
        temp_deci_c: i16,
    },
}

/// Validated sensor sample produced after packet verification.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct VerifiedSample {
    pub channel_id: u8,
    pub seq: u16,
    pub millivolts: u16,
    pub mode: OperationalMode,
}

/// Explicit domain errors for packet and frame validation.
///
/// C/C++ note: Instead of returning negative `errno` integers that lose context,
/// each `PacketError` variant records the exact offending value and bounds.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PacketError {
    InvalidChannel {
        channel_id: u8,
        max_channel: u8,
    },
    HardwareFaultFlag(u8),
    VoltageOutOfBounds {
        millivolts: u16,
        min_mv: u16,
        max_mv: u16,
    },
    NonMonotonicSequence {
        expected_min_seq: u16,
        actual_seq: u16,
    },
}

/// Validates channel bounds and hardware fault flags.
pub fn validate_header(packet: &RawPacket) -> Result<(), PacketError> {
    if packet.channel_id > MAX_CHANNEL_ID {
        return Err(PacketError::InvalidChannel {
            channel_id: packet.channel_id,
            max_channel: MAX_CHANNEL_ID,
        });
    }

    let fault_bits = packet.status_flags & FLAG_HW_FAULT_MASK;
    if fault_bits != 0 {
        return Err(PacketError::HardwareFaultFlag(fault_bits));
    }

    Ok(())
}

/// Validates ADC millivolts and decodes the sensor's `OperationalMode`.
///
/// Linear transfer function for active mode:
/// `temp_deci_c = (millivolts as i16 - 500) / 2` (so `500 mV` = `0.0 °C`, `2500 mV` = `100.0 °C`,
/// `3000 mV` = `125.0 °C`).
pub fn decode_operational_mode(
    raw_millivolts: u16,
    status_flags: u8,
) -> Result<OperationalMode, PacketError> {
    if (status_flags & FLAG_STANDBY_BIT) != 0 {
        return Ok(OperationalMode::Standby);
    }

    if !(MIN_VALID_MV..=MAX_VALID_MV).contains(&raw_millivolts) {
        return Err(PacketError::VoltageOutOfBounds {
            millivolts: raw_millivolts,
            min_mv: MIN_VALID_MV,
            max_mv: MAX_VALID_MV,
        });
    }

    let temp_deci_c = ((raw_millivolts as i16) - 500) / 2;
    let shutdown_temp_deci_c = ((SHUTDOWN_THRESHOLD_MV as i16) - 500) / 2;

    let mode = match raw_millivolts {
        mv if mv >= SHUTDOWN_THRESHOLD_MV => OperationalMode::EmergencyShutdown { temp_deci_c },
        mv if mv >= WARNING_THRESHOLD_MV => OperationalMode::Warning {
            temp_deci_c,
            margin_to_shutdown_deci_c: shutdown_temp_deci_c - temp_deci_c,
        },
        _ => OperationalMode::Normal { temp_deci_c },
    };

    Ok(mode)
}

/// Multi-step packet validation and decoding using the `?` operator.
///
/// C/C++ note: Each `?` unwraps `Ok(...)` or returns `Err(PacketError)` to the caller
/// immediately, replacing repetitive `if (err != 0) return err;` boilerplate.
pub fn decode_packet(packet: &RawPacket) -> Result<VerifiedSample, PacketError> {
    validate_header(packet)?;
    let mode = decode_operational_mode(packet.raw_millivolts, packet.status_flags)?;

    Ok(VerifiedSample {
        channel_id: packet.channel_id,
        seq: packet.seq,
        millivolts: packet.raw_millivolts,
        mode,
    })
}

/// Decodes a sequence of packets, verifying that sequence numbers never decrease
/// and propagating any validation error with `?`.
pub fn decode_ordered_frame(packets: &[RawPacket]) -> Result<Vec<VerifiedSample>, PacketError> {
    let mut verified = Vec::with_capacity(packets.len());
    let mut min_next_seq: Option<u16> = None;

    for packet in packets {
        if let Some(expected_min) = min_next_seq
            && packet.seq < expected_min
        {
            return Err(PacketError::NonMonotonicSequence {
                expected_min_seq: expected_min,
                actual_seq: packet.seq,
            });
        }

        let sample = decode_packet(packet)?;
        min_next_seq = Some(sample.seq.saturating_add(1));
        verified.push(sample);
    }

    Ok(verified)
}

/// Exhaustive `match` over `OperationalMode` returning a numeric severity level (`0..=3`).
pub fn mode_severity_level(mode: OperationalMode) -> u8 {
    match mode {
        OperationalMode::Standby => 0,
        OperationalMode::Normal { .. } => 1,
        OperationalMode::Warning { .. } => 2,
        OperationalMode::EmergencyShutdown { .. } => 3,
    }
}

/// Uses `if let` when only a single enum variant (`EmergencyShutdown`) is of interest.
pub fn extract_emergency_temp(sample: &VerifiedSample) -> Option<i16> {
    if let OperationalMode::EmergencyShutdown { temp_deci_c } = sample.mode {
        Some(temp_deci_c)
    } else {
        None
    }
}

/// Looks up the most recent verified sample for `target_channel`.
///
/// Returns `Option<&VerifiedSample>` (`None` when the channel is absent from the slice).
pub fn find_latest_channel_sample(
    samples: &[VerifiedSample],
    target_channel: u8,
) -> Option<&VerifiedSample> {
    samples
        .iter()
        .rev()
        .find(|sample| sample.channel_id == target_channel)
}

/// Combines `Result` and `Option` to separate malformed input from absent results:
/// - `Err(PacketError)`: the frame contains an invalid packet or sequence fault.
/// - `Ok(None)`: all packets are valid, but `target_channel` has no emergency shutdown reading.
/// - `Ok(Some(temp_deci_c))`: all packets are valid and `target_channel` triggered emergency shutdown.
pub fn query_channel_emergency_temp(
    packets: &[RawPacket],
    target_channel: u8,
) -> Result<Option<i16>, PacketError> {
    let verified_frame = decode_ordered_frame(packets)?;

    let emergency_temp = find_latest_channel_sample(&verified_frame, target_channel)
        .and_then(extract_emergency_temp);

    Ok(emergency_temp)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_valid_packets_across_all_operational_modes_and_boundaries() {
        // Standby ignores voltage bounds when FLAG_STANDBY_BIT is set.
        let standby_pkt = RawPacket {
            channel_id: 0,
            seq: 1,
            raw_millivolts: 0,
            status_flags: FLAG_STANDBY_BIT,
        };
        let standby = decode_packet(&standby_pkt).expect("standby packet should be valid");
        assert_eq!(standby.mode, OperationalMode::Standby);
        assert_eq!(mode_severity_level(standby.mode), 0);

        // Lower voltage boundary: 100 mV -> (100 - 500) / 2 = -200 (-20.0 °C).
        let min_mv_pkt = RawPacket {
            channel_id: MAX_CHANNEL_ID,
            seq: 2,
            raw_millivolts: MIN_VALID_MV,
            status_flags: 0,
        };
        let min_sample = decode_packet(&min_mv_pkt).expect("min mV boundary should be valid");
        assert_eq!(
            min_sample.mode,
            OperationalMode::Normal { temp_deci_c: -200 }
        );
        assert_eq!(mode_severity_level(min_sample.mode), 1);

        // Warning threshold boundary: 2500 mV -> 1000 (100.0 °C), margin 250 (25.0 °C).
        let warning_pkt = RawPacket {
            channel_id: 2,
            seq: 3,
            raw_millivolts: WARNING_THRESHOLD_MV,
            status_flags: 0,
        };
        let warning_sample =
            decode_packet(&warning_pkt).expect("warning threshold should be valid");
        assert_eq!(
            warning_sample.mode,
            OperationalMode::Warning {
                temp_deci_c: 1000,
                margin_to_shutdown_deci_c: 250,
            }
        );
        assert_eq!(mode_severity_level(warning_sample.mode), 2);

        // Shutdown threshold & upper voltage boundary: 3000 mV and 3300 mV.
        let shutdown_pkt = RawPacket {
            channel_id: 3,
            seq: 4,
            raw_millivolts: SHUTDOWN_THRESHOLD_MV,
            status_flags: 0,
        };
        let shutdown_sample =
            decode_packet(&shutdown_pkt).expect("shutdown threshold should be valid");
        assert_eq!(
            shutdown_sample.mode,
            OperationalMode::EmergencyShutdown { temp_deci_c: 1250 }
        );
        assert_eq!(mode_severity_level(shutdown_sample.mode), 3);

        let max_mv_pkt = RawPacket {
            channel_id: 3,
            seq: 5,
            raw_millivolts: MAX_VALID_MV,
            status_flags: 0,
        };
        let max_sample = decode_packet(&max_mv_pkt).expect("max mV boundary should be valid");
        assert_eq!(
            max_sample.mode,
            OperationalMode::EmergencyShutdown { temp_deci_c: 1400 }
        );
    }

    #[test]
    fn rejects_invalid_channel_fault_flags_and_out_of_bounds_voltage() {
        let bad_channel = RawPacket {
            channel_id: MAX_CHANNEL_ID + 1,
            seq: 1,
            raw_millivolts: 1000,
            status_flags: 0,
        };
        assert_eq!(
            decode_packet(&bad_channel),
            Err(PacketError::InvalidChannel {
                channel_id: 8,
                max_channel: 7,
            })
        );

        let hw_fault = RawPacket {
            channel_id: 1,
            seq: 2,
            raw_millivolts: 1000,
            status_flags: 0b0010_0000,
        };
        assert_eq!(
            decode_packet(&hw_fault),
            Err(PacketError::HardwareFaultFlag(0b0010_0000))
        );

        let under_voltage = RawPacket {
            channel_id: 1,
            seq: 3,
            raw_millivolts: MIN_VALID_MV - 1,
            status_flags: 0,
        };
        assert_eq!(
            decode_packet(&under_voltage),
            Err(PacketError::VoltageOutOfBounds {
                millivolts: 99,
                min_mv: MIN_VALID_MV,
                max_mv: MAX_VALID_MV,
            })
        );

        let over_voltage = RawPacket {
            channel_id: 1,
            seq: 4,
            raw_millivolts: MAX_VALID_MV + 1,
            status_flags: 0,
        };
        assert_eq!(
            decode_packet(&over_voltage),
            Err(PacketError::VoltageOutOfBounds {
                millivolts: 3301,
                min_mv: MIN_VALID_MV,
                max_mv: MAX_VALID_MV,
            })
        );
    }

    #[test]
    fn propagates_errors_and_enforces_sequence_order_in_frames() {
        let valid_frame = [
            RawPacket {
                channel_id: 0,
                seq: 10,
                raw_millivolts: 1500,
                status_flags: 0,
            },
            RawPacket {
                channel_id: 1,
                seq: 12,
                raw_millivolts: 2600,
                status_flags: 0,
            },
        ];
        let decoded = decode_ordered_frame(&valid_frame).expect("frame should be valid");
        assert_eq!(decoded.len(), 2);

        // Duplicate or decreasing sequence numbers must fail with NonMonotonicSequence.
        let non_monotonic = [
            RawPacket {
                channel_id: 0,
                seq: 10,
                raw_millivolts: 1500,
                status_flags: 0,
            },
            RawPacket {
                channel_id: 1,
                seq: 10,
                raw_millivolts: 1600,
                status_flags: 0,
            },
        ];
        assert_eq!(
            decode_ordered_frame(&non_monotonic),
            Err(PacketError::NonMonotonicSequence {
                expected_min_seq: 11,
                actual_seq: 10,
            })
        );

        // Inner packet validation errors propagate out of `decode_ordered_frame` via `?`.
        let frame_with_corrupt_pkt = [
            RawPacket {
                channel_id: 0,
                seq: 1,
                raw_millivolts: 1500,
                status_flags: 0,
            },
            RawPacket {
                channel_id: 2,
                seq: 2,
                raw_millivolts: 50,
                status_flags: 0,
            },
        ];
        assert_eq!(
            decode_ordered_frame(&frame_with_corrupt_pkt),
            Err(PacketError::VoltageOutOfBounds {
                millivolts: 50,
                min_mv: MIN_VALID_MV,
                max_mv: MAX_VALID_MV,
            })
        );
    }

    #[test]
    fn distinguishes_absent_data_from_invalid_input_in_queries() {
        let packets = [
            RawPacket {
                channel_id: 1,
                seq: 100,
                raw_millivolts: 1500, // Normal (50.0 °C)
                status_flags: 0,
            },
            RawPacket {
                channel_id: 2,
                seq: 101,
                raw_millivolts: 3100, // EmergencyShutdown (130.0 °C)
                status_flags: 0,
            },
        ];

        // Channel 2 is present and in EmergencyShutdown -> Ok(Some(1300)).
        assert_eq!(query_channel_emergency_temp(&packets, 2), Ok(Some(1300)));

        // Channel 1 is present and valid, but in Normal mode -> Ok(None).
        assert_eq!(query_channel_emergency_temp(&packets, 1), Ok(None));

        // Channel 5 is absent from a valid frame -> Ok(None).
        assert_eq!(query_channel_emergency_temp(&packets, 5), Ok(None));

        // Empty frame is valid but has no samples -> Ok(None).
        assert_eq!(query_channel_emergency_temp(&[], 1), Ok(None));
    }
}
