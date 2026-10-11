//! Week 7 — Rust Fundamentals: Embedded Sensor Telemetry Exercise
//!
//! Demonstrates core Rust syntax and semantics with notes for C/C++ developers:
//! 1. Variables, mutability (`let` vs `let mut`), and explicit scalar types (`i16`, `u32`, `usize`, `bool`).
//! 2. Functions and expression-oriented return values.
//! 3. `if` / `else` expressions and loops (`for`, `while`).
//! 4. Algebraic `enum` types and exhaustive `match` pattern matching.
//! 5. Heap-allocated `Vec<T>`, `String`, slices (`&[T]`, `&str`), and iterator pipelines.
//! 6. Type-safe error handling with `Result<T, E>` and `Option<T>`.

pub mod analyzer;
pub mod ownership;
pub mod types_errors;

/// Hardware ADC sentinel indicating an open-circuit / disconnected thermistor.
pub const SENSOR_DISCONNECTED_RAW: i16 = i16::MIN;

/// Valid industrial sensor operating range in tenths of a degree Celsius (0.1 °C).
/// -40.0 °C (-400) to +125.0 °C (1250).
pub const SENSOR_MIN_DECI_C: i16 = -400;
pub const SENSOR_MAX_DECI_C: i16 = 1250;

/// Threshold at or above which a reading is considered critical overheat (+85.0 °C).
pub const OVERHEAT_THRESHOLD_DECI_C: i16 = 850;

/// Discrete thermal operating state.
///
/// C/C++ note: `#[derive(...)]` automatically generates trait implementations
/// for formatting (`Debug`), value copying (`Clone`, `Copy`), and equality (`PartialEq`, `Eq`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ThermalState {
    Cold,
    Nominal,
    Warm,
    CriticalOverheat,
}

/// Domain error type for sensor validation and batch processing.
///
/// C/C++ note: Rust enums are tagged unions (sum types). Variants like
/// `OutOfRange(i16)` can carry typed payload data directly without a separate `union`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SensorError {
    DisconnectedFault,
    OutOfRange(i16),
    EmptyBatch,
}

/// Aggregated summary of a validated sensor telemetry batch.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TelemetrySummary {
    pub sensor_id: String,
    pub valid_count: usize,
    pub min_deci_c: i16,
    pub max_deci_c: i16,
    pub avg_deci_c: i16,
    pub peak_state: ThermalState,
    pub first_overheat_index: Option<usize>,
}

/// Validates a single raw sensor reading in 0.1 °C units.
///
/// Returns `Ok(reading)` if within `[-400, 1250]`, or `Err(SensorError)` otherwise.
pub fn validate_reading(raw_deci_c: i16) -> Result<i16, SensorError> {
    if raw_deci_c == SENSOR_DISCONNECTED_RAW {
        return Err(SensorError::DisconnectedFault);
    }

    // `if` / `else` is an expression in Rust; the final expression (without `;`) is returned.
    if (SENSOR_MIN_DECI_C..=SENSOR_MAX_DECI_C).contains(&raw_deci_c) {
        Ok(raw_deci_c)
    } else {
        Err(SensorError::OutOfRange(raw_deci_c))
    }
}

/// Classifies a validated temperature reading (0.1 °C) into a `ThermalState`.
///
/// C/C++ note: `match` is exhaustive—the compiler rejects the program if any
/// possible `i16` value is not covered by a pattern arm.
pub fn classify_temperature(deci_c: i16) -> ThermalState {
    match deci_c {
        i16::MIN..=0 => ThermalState::Cold,
        1..=600 => ThermalState::Nominal,
        601..=849 => ThermalState::Warm,
        850..=i16::MAX => ThermalState::CriticalOverheat,
    }
}

/// Scans a slice of readings using a `while` loop and returns the index of the
/// first reading that reaches or exceeds `OVERHEAT_THRESHOLD_DECI_C`.
///
/// C/C++ note: Instead of returning `-1` as a magic sentinel, Rust returns `Option<usize>`.
pub fn find_first_overheat_index(readings: &[i16]) -> Option<usize> {
    // Variables are immutable by default; `mut` explicitly enables mutation.
    let mut index: usize = 0;

    while index < readings.len() {
        if readings[index] >= OVERHEAT_THRESHOLD_DECI_C {
            return Some(index);
        }
        index += 1;
    }

    None
}

/// Validates all readings in a batch and computes summary statistics.
///
/// Uses the `?` operator to propagate any `SensorError` early to the caller.
pub fn summarize_batch(
    sensor_id: &str,
    raw_readings: &[i16],
) -> Result<TelemetrySummary, SensorError> {
    if raw_readings.is_empty() {
        return Err(SensorError::EmptyBatch);
    }

    // `Vec<i16>` is a growable heap-allocated array (similar to `std::vector<int16_t>`).
    let mut validated: Vec<i16> = Vec::with_capacity(raw_readings.len());
    for &raw in raw_readings {
        // The `?` operator unwraps `Ok(val)` or returns `Err(e)` immediately.
        let clean = validate_reading(raw)?;
        validated.push(clean);
    }

    let mut min_deci_c: i16 = validated[0];
    let mut max_deci_c: i16 = validated[0];
    // Use `i32` accumulator to prevent `i16` overflow when summing a batch.
    let mut sum_deci_c: i32 = 0;

    for &val in &validated {
        if val < min_deci_c {
            min_deci_c = val;
        }
        if val > max_deci_c {
            max_deci_c = val;
        }
        sum_deci_c += i32::from(val);
    }

    let valid_count: usize = validated.len();
    let avg_deci_c: i16 = (sum_deci_c / (valid_count as i32)) as i16;
    let peak_state: ThermalState = classify_temperature(max_deci_c);
    let first_overheat_index: Option<usize> = find_first_overheat_index(&validated);

    Ok(TelemetrySummary {
        sensor_id: String::from(sensor_id),
        valid_count,
        min_deci_c,
        max_deci_c,
        avg_deci_c,
        peak_state,
        first_overheat_index,
    })
}

/// Filters a noisy raw stream, keeping only valid readings and mapping them to `(i16, ThermalState)`.
pub fn collect_valid_states(raw_readings: &[i16]) -> Vec<(i16, ThermalState)> {
    raw_readings
        .iter()
        .copied()
        .filter_map(|raw| validate_reading(raw).ok())
        .map(|temp| (temp, classify_temperature(temp)))
        .collect()
}

/// Formats a human-readable telemetry line from a `TelemetrySummary`.
pub fn format_summary_report(summary: &TelemetrySummary) -> String {
    let alert_note = match summary.first_overheat_index {
        Some(idx) => format!("OVERHEAT at sample #{idx}"),
        None => String::from("no overheat alerts"),
    };

    format!(
        "[{}] samples={} min={}.{}C max={}.{}C avg={}.{}C peak={:?} ({})",
        summary.sensor_id,
        summary.valid_count,
        summary.min_deci_c / 10,
        (summary.min_deci_c % 10).abs(),
        summary.max_deci_c / 10,
        (summary.max_deci_c % 10).abs(),
        summary.avg_deci_c / 10,
        (summary.avg_deci_c % 10).abs(),
        summary.peak_state,
        alert_note,
    )
}

fn main() {
    let mcu_temps_deci_c: [i16; 6] = [245, 310, 620, 865, 540, 295];

    match summarize_batch("MCU-THERM-01", &mcu_temps_deci_c) {
        Ok(summary) => {
            println!("{}", format_summary_report(&summary));
        }
        Err(err) => {
            eprintln!("Telemetry batch rejected: {err:?}");
        }
    }

    let noisy_stream: [i16; 5] = [-50, SENSOR_DISCONNECTED_RAW, 250, 1400, 720];
    let valid_states = collect_valid_states(&noisy_stream);
    println!("Filtered valid state pairs: {valid_states:?}");

    let (mut record, ch) = ownership::demonstrate_move_vs_copy();
    let label_info = ownership::inspect_sensor_label(&record.label);
    ownership::apply_calibrated_sample(&mut record, -10, mcu_temps_deci_c[0]);
    let (_, latest_cal) = ownership::observe_then_update_record(&mut record, mcu_temps_deci_c[1]);
    let slice_stats = ownership::summarize_reading_slice(&mcu_temps_deci_c[..3]);
    let chosen_label = ownership::select_more_detailed_label(&record.label, "MCU-CH3");
    println!(
        "Ownership demo: label={chosen_label} ch={ch} valid_tag={} cal_deci_c={latest_cal} window={slice_stats:?}",
        label_info.is_valid_ascii_tag,
    );

    let frame = [
        types_errors::RawPacket {
            channel_id: 1,
            seq: 1,
            raw_millivolts: 1500,
            status_flags: 0,
        },
        types_errors::RawPacket {
            channel_id: 2,
            seq: 2,
            raw_millivolts: 3000,
            status_flags: 0,
        },
    ];
    if let Ok(Some(emergency_deci_c)) = types_errors::query_channel_emergency_temp(&frame, 2) {
        let severity =
            types_errors::mode_severity_level(types_errors::OperationalMode::EmergencyShutdown {
                temp_deci_c: emergency_deci_c,
            });
        println!(
            "Packet decoder demo: ch=2 emergency_deci_c={emergency_deci_c} severity={severity}"
        );
    }

    if let Ok(analysis) = analyzer::analyze_calibrated_batch(
        "MCU-01",
        "MCU-01-STATOR-WINDING",
        -15,
        &mcu_temps_deci_c,
    ) {
        println!(
            "Analyzer report: {}",
            analyzer::format_analysis_report(&analysis)
        );
    }

    if let Ok(bus_analysis) = analyzer::analyze_active_packet_frame("SENS-BUS-MAIN", &frame) {
        println!(
            "Packet-bus analysis: {}",
            analyzer::format_analysis_report(&bus_analysis)
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_normal_and_boundary_sensor_readings() {
        assert_eq!(validate_reading(0), Ok(0));
        assert_eq!(validate_reading(250), Ok(250));
        assert_eq!(validate_reading(SENSOR_MIN_DECI_C), Ok(-400));
        assert_eq!(validate_reading(SENSOR_MAX_DECI_C), Ok(1250));
    }

    #[test]
    fn rejects_disconnected_and_out_of_range_readings() {
        assert_eq!(
            validate_reading(SENSOR_DISCONNECTED_RAW),
            Err(SensorError::DisconnectedFault)
        );
        assert_eq!(
            validate_reading(SENSOR_MIN_DECI_C - 1),
            Err(SensorError::OutOfRange(-401))
        );
        assert_eq!(
            validate_reading(SENSOR_MAX_DECI_C + 1),
            Err(SensorError::OutOfRange(1251))
        );
    }

    #[test]
    fn classifies_thermal_states_across_thresholds() {
        assert_eq!(classify_temperature(-100), ThermalState::Cold);
        assert_eq!(classify_temperature(0), ThermalState::Cold);
        assert_eq!(classify_temperature(1), ThermalState::Nominal);
        assert_eq!(classify_temperature(600), ThermalState::Nominal);
        assert_eq!(classify_temperature(601), ThermalState::Warm);
        assert_eq!(classify_temperature(849), ThermalState::Warm);
        assert_eq!(classify_temperature(850), ThermalState::CriticalOverheat);
    }

    #[test]
    fn summarizes_valid_batch_and_detects_overheat_index() {
        let samples = [200, 400, 850, 550];
        let summary = summarize_batch("SENSOR-A", &samples).expect("batch should be valid");

        assert_eq!(summary.sensor_id, "SENSOR-A");
        assert_eq!(summary.valid_count, 4);
        assert_eq!(summary.min_deci_c, 200);
        assert_eq!(summary.max_deci_c, 850);
        assert_eq!(summary.avg_deci_c, 500);
        assert_eq!(summary.peak_state, ThermalState::CriticalOverheat);
        assert_eq!(summary.first_overheat_index, Some(2));

        let report = format_summary_report(&summary);
        assert!(report.contains("[SENSOR-A] samples=4"));
        assert!(report.contains("OVERHEAT at sample #2"));
    }

    #[test]
    fn returns_none_when_no_sample_overheats_and_errors_on_invalid_batch() {
        let nominal_samples = [180, 220, 250];
        let summary = summarize_batch("SENSOR-B", &nominal_samples).expect("batch should be valid");
        assert_eq!(summary.first_overheat_index, None);
        assert_eq!(summary.peak_state, ThermalState::Nominal);

        assert_eq!(summarize_batch("EMPTY", &[]), Err(SensorError::EmptyBatch));
        assert_eq!(
            summarize_batch("FAULTY", &[200, SENSOR_DISCONNECTED_RAW, 250]),
            Err(SensorError::DisconnectedFault)
        );
    }

    #[test]
    fn filters_noisy_stream_into_valid_state_pairs() {
        let noisy = [-450, -20, SENSOR_DISCONNECTED_RAW, 450, 900, 1300];
        let pairs = collect_valid_states(&noisy);

        assert_eq!(
            pairs,
            vec![
                (-20, ThermalState::Cold),
                (450, ThermalState::Nominal),
                (900, ThermalState::CriticalOverheat),
            ]
        );
    }
}
