//! Week 7 — Checkpoint 4.4: Integrated Sensor Telemetry Analyzer Mini Project
//!
//! Synthesizes concepts from Checkpoints 4.1–4.3 into an end-to-end telemetry
//! analyzer by reusing existing validation, borrowing, slice, and packet-decoding helpers:
//! - Validates sensor labels and selects the more detailed tag using lifetime-bound `&'a str`.
//! - Validates raw and calibration-adjusted readings without consuming caller buffers (`&[i16]`).
//! - Computes summary statistics (`min`, `max`, `avg`, `first_overheat_index`, peak-to-peak span,
//!   and per-state sample distribution).
//! - Bridges multi-channel ADC `RawPacket` frames into the thermal analyzer with `?` propagation.

use crate::ownership::{inspect_sensor_label, select_more_detailed_label, summarize_reading_slice};
use crate::types_errors::{OperationalMode, PacketError, RawPacket, decode_ordered_frame};
use crate::{
    SensorError, TelemetrySummary, ThermalState, classify_temperature, format_summary_report,
    summarize_batch, validate_reading,
};

/// Distribution of validated samples across discrete thermal operating states.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StateBreakdown {
    pub cold_count: usize,
    pub nominal_count: usize,
    pub warm_count: usize,
    pub critical_overheat_count: usize,
}

/// Complete telemetry analysis result borrowing the selected sensor label with lifetime `'a`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AnalysisReport<'a> {
    pub active_label: &'a str,
    pub calibration_offset_deci_c: i16,
    pub summary: TelemetrySummary,
    pub span_deci_c: i32,
    pub breakdown: StateBreakdown,
}

/// Unified error type for the integrated telemetry analyzer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AnalyzerError {
    InvalidSensorLabel,
    EmptyBatch,
    SampleFault {
        sample_index: usize,
        source: SensorError,
    },
    PacketFault(PacketError),
}

impl From<PacketError> for AnalyzerError {
    fn from(err: PacketError) -> Self {
        Self::PacketFault(err)
    }
}

/// Counts how many readings fall into each `ThermalState`.
pub fn compute_state_breakdown(validated_readings: &[i16]) -> StateBreakdown {
    let mut breakdown = StateBreakdown {
        cold_count: 0,
        nominal_count: 0,
        warm_count: 0,
        critical_overheat_count: 0,
    };

    for &reading in validated_readings {
        match classify_temperature(reading) {
            ThermalState::Cold => breakdown.cold_count += 1,
            ThermalState::Nominal => breakdown.nominal_count += 1,
            ThermalState::Warm => breakdown.warm_count += 1,
            ThermalState::CriticalOverheat => breakdown.critical_overheat_count += 1,
        }
    }

    breakdown
}

/// Validates a sensor label pair, applies `calibration_offset_deci_c` to a borrowed slice
/// of raw readings (`&[i16]`), validates each sample, and produces an `AnalysisReport<'a>`.
///
/// Reuses `select_more_detailed_label`, `inspect_sensor_label`, `validate_reading`,
/// `summarize_batch`, and `summarize_reading_slice` without taking ownership of caller buffers.
pub fn analyze_calibrated_batch<'a>(
    primary_label: &'a str,
    fallback_label: &'a str,
    calibration_offset_deci_c: i16,
    raw_readings: &[i16],
) -> Result<AnalysisReport<'a>, AnalyzerError> {
    let active_label = select_more_detailed_label(primary_label, fallback_label);
    let label_check = inspect_sensor_label(active_label);
    if !label_check.has_standard_prefix || !label_check.is_valid_ascii_tag {
        return Err(AnalyzerError::InvalidSensorLabel);
    }

    if raw_readings.is_empty() {
        return Err(AnalyzerError::EmptyBatch);
    }

    let mut calibrated_readings: Vec<i16> = Vec::with_capacity(raw_readings.len());
    for (idx, &raw) in raw_readings.iter().enumerate() {
        // First validate the raw reading (catches hardware disconnect sentinels and raw bounds).
        let valid_raw = validate_reading(raw).map_err(|source| AnalyzerError::SampleFault {
            sample_index: idx,
            source,
        })?;

        // Apply calibration offset using saturating arithmetic, then re-verify physical bounds.
        let adjusted = valid_raw.saturating_add(calibration_offset_deci_c);
        let valid_adjusted =
            validate_reading(adjusted).map_err(|source| AnalyzerError::SampleFault {
                sample_index: idx,
                source,
            })?;

        calibrated_readings.push(valid_adjusted);
    }

    // Reuse Checkpoint 4.1 `summarize_batch` and Checkpoint 4.2 `summarize_reading_slice`.
    let summary = summarize_batch(active_label, &calibrated_readings).map_err(|source| {
        AnalyzerError::SampleFault {
            sample_index: 0,
            source,
        }
    })?;

    let slice_stats =
        summarize_reading_slice(&calibrated_readings).ok_or(AnalyzerError::EmptyBatch)?;
    let breakdown = compute_state_breakdown(&calibrated_readings);

    Ok(AnalysisReport {
        active_label,
        calibration_offset_deci_c,
        summary,
        span_deci_c: slice_stats.span_deci_c,
        breakdown,
    })
}

/// Decodes an ordered ADC `RawPacket` frame, extracts active (non-standby) temperature
/// readings, and runs the batch analyzer over those samples.
///
/// Demonstrates multi-stage error propagation (`PacketError` -> `AnalyzerError` via `?`).
pub fn analyze_active_packet_frame<'a>(
    sensor_label: &'a str,
    packets: &[RawPacket],
) -> Result<AnalysisReport<'a>, AnalyzerError> {
    let verified_samples = decode_ordered_frame(packets)?;

    let active_temps: Vec<i16> = verified_samples
        .iter()
        .filter_map(|sample| match sample.mode {
            OperationalMode::Standby => None,
            OperationalMode::Normal { temp_deci_c }
            | OperationalMode::Warning { temp_deci_c, .. }
            | OperationalMode::EmergencyShutdown { temp_deci_c } => Some(temp_deci_c),
        })
        .collect();

    analyze_calibrated_batch(sensor_label, sensor_label, 0, &active_temps)
}

/// Formats an `AnalysisReport` into a concise, human-readable multi-line report.
pub fn format_analysis_report(report: &AnalysisReport<'_>) -> String {
    let headline = format_summary_report(&report.summary);
    format!(
        "{headline} | cal_offset={}.{}C span={}.{}C states=[cold={}, nominal={}, warm={}, overheat={}]",
        report.calibration_offset_deci_c / 10,
        (report.calibration_offset_deci_c % 10).abs(),
        report.span_deci_c / 10,
        (report.span_deci_c % 10).abs(),
        report.breakdown.cold_count,
        report.breakdown.nominal_count,
        report.breakdown.warm_count,
        report.breakdown.critical_overheat_count,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types_errors::{FLAG_STANDBY_BIT, MIN_VALID_MV};
    use crate::{SENSOR_DISCONNECTED_RAW, SENSOR_MAX_DECI_C, SENSOR_MIN_DECI_C};

    #[test]
    fn analyzes_normal_batch_and_detects_overheat_while_borrowing_inputs() {
        let short_tag = String::from("MCU-01");
        let detailed_tag = String::from("MCU-01-INVERTER-BRIDGE");
        let raw_samples: Vec<i16> = vec![-10, 250, 620, 860, 410];

        let report = analyze_calibrated_batch(&short_tag, &detailed_tag, -10, &raw_samples)
            .expect("normal batch should succeed");

        // Calibrated samples: [-20, 240, 610, 850, 400]
        assert_eq!(report.active_label, "MCU-01-INVERTER-BRIDGE");
        assert_eq!(report.summary.valid_count, 5);
        assert_eq!(report.summary.min_deci_c, -20);
        assert_eq!(report.summary.max_deci_c, 850);
        assert_eq!(report.summary.avg_deci_c, 416);
        assert_eq!(report.summary.peak_state, ThermalState::CriticalOverheat);
        assert_eq!(report.summary.first_overheat_index, Some(3));
        assert_eq!(report.span_deci_c, 870);
        assert_eq!(
            report.breakdown,
            StateBreakdown {
                cold_count: 1,
                nominal_count: 2,
                warm_count: 1,
                critical_overheat_count: 1,
            }
        );

        let formatted = format_analysis_report(&report);
        assert!(formatted.contains("[MCU-01-INVERTER-BRIDGE] samples=5"));
        assert!(formatted.contains("OVERHEAT at sample #3"));
        assert!(formatted.contains("states=[cold=1, nominal=2, warm=1, overheat=1]"));

        // Caller still owns and can read `short_tag`, `detailed_tag`, and `raw_samples`.
        assert_eq!(short_tag, "MCU-01");
        assert_eq!(detailed_tag, "MCU-01-INVERTER-BRIDGE");
        assert_eq!(raw_samples.len(), 5);
    }

    #[test]
    fn handles_empty_input_and_invalid_sensor_labels_explicitly() {
        let empty: [i16; 0] = [];
        assert_eq!(
            analyze_calibrated_batch("MCU-01", "MCU-01", 0, &empty),
            Err(AnalyzerError::EmptyBatch)
        );

        assert_eq!(
            analyze_calibrated_batch("BAD_LABEL", "BAD", 0, &[250]),
            Err(AnalyzerError::InvalidSensorLabel)
        );
    }

    #[test]
    fn accepts_exact_boundary_temperatures_and_reports_no_overheat_when_below_threshold() {
        let boundary_samples = [SENSOR_MIN_DECI_C, 0, 600, 849];
        let report = analyze_calibrated_batch("SENS-BOUNDARY", "SENS-0", 0, &boundary_samples)
            .expect("boundary temperatures should be valid");

        assert_eq!(report.summary.min_deci_c, -400);
        assert_eq!(report.summary.max_deci_c, 849);
        assert_eq!(report.summary.first_overheat_index, None);
        assert_eq!(report.summary.peak_state, ThermalState::Warm);
        assert_eq!(report.span_deci_c, 1249);
    }

    #[test]
    fn rejects_invalid_raw_or_calibration_shifted_readings_with_sample_index() {
        let with_disconnect = [220, 310, SENSOR_DISCONNECTED_RAW, 400];
        assert_eq!(
            analyze_calibrated_batch("MCU-02", "MCU-02", 0, &with_disconnect),
            Err(AnalyzerError::SampleFault {
                sample_index: 2,
                source: SensorError::DisconnectedFault,
            })
        );

        // Raw sample 1245 is valid, but +10 calibration shifts it to 1255 (> SENSOR_MAX_DECI_C = 1250).
        let shifted_out_of_range = [200, SENSOR_MAX_DECI_C - 5];
        assert_eq!(
            analyze_calibrated_batch("MCU-02", "MCU-02", 10, &shifted_out_of_range),
            Err(AnalyzerError::SampleFault {
                sample_index: 1,
                source: SensorError::OutOfRange(1255),
            })
        );
    }

    #[test]
    fn propagates_packet_and_sample_errors_from_packet_frames() {
        let valid_packets = [
            RawPacket {
                channel_id: 0,
                seq: 1,
                raw_millivolts: 0,
                status_flags: FLAG_STANDBY_BIT, // Standby sample skipped
            },
            RawPacket {
                channel_id: 1,
                seq: 2,
                raw_millivolts: 1000, // 25.0 °C (250 deci-C)
                status_flags: 0,
            },
            RawPacket {
                channel_id: 1,
                seq: 3,
                raw_millivolts: 2200, // 85.0 °C (850 deci-C -> overheat)
                status_flags: 0,
            },
        ];

        let report = analyze_active_packet_frame("SENS-BUS-01", &valid_packets)
            .expect("valid packet frame should analyze cleanly");
        assert_eq!(report.summary.valid_count, 2);
        assert_eq!(report.summary.first_overheat_index, Some(1));

        // Corrupt packet propagates `PacketError` wrapped in `AnalyzerError::PacketFault`.
        let corrupt_packets = [RawPacket {
            channel_id: 1,
            seq: 1,
            raw_millivolts: MIN_VALID_MV - 10,
            status_flags: 0,
        }];
        assert_eq!(
            analyze_active_packet_frame("SENS-BUS-01", &corrupt_packets),
            Err(AnalyzerError::PacketFault(
                PacketError::VoltageOutOfBounds {
                    millivolts: 90,
                    min_mv: MIN_VALID_MV,
                    max_mv: 3300,
                }
            ))
        );
    }
}
