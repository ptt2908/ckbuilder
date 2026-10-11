//! Week 7 — Checkpoint 4.2: Ownership, Borrowing, Slices, and Lifetimes
//!
//! Focused embedded sensor telemetry examples with notes for C/C++ developers:
//! 1. Move semantics (`String` ownership transfer vs `Copy` scalar types).
//! 2. Borrowing (`&str` shared inspection and `&mut` exclusive record mutation).
//! 3. Slices (`&[i16]` zero-copy views over arrays and `Vec<i16>`).
//! 4. Lifetimes (`'a` reference relationship annotations).

/// Mutable telemetry record for an individual sensor channel.
///
/// C/C++ note: Because `label` is a heap-allocated `String` (pointer, length, capacity),
/// `SensorRecord` owns its heap buffer and cannot implement `Copy`. Passing a `SensorRecord`
/// by value transfers (moves) ownership of the heap buffer without deep-copying it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SensorRecord {
    pub label: String,
    pub channel: u8,
    pub calibration_offset_deci_c: i16,
    pub last_calibrated_deci_c: i16,
    pub sample_count: u32,
}

/// Result of inspecting a borrowed sensor label (`&str`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LabelInspection {
    pub byte_len: usize,
    pub has_standard_prefix: bool,
    pub is_valid_ascii_tag: bool,
}

/// Summary computed over a borrowed slice of sensor readings (`&[i16]`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SliceSummary {
    pub count: usize,
    pub min_deci_c: i16,
    pub max_deci_c: i16,
    /// Peak-to-peak span (`max - min`) stored in `i32` to prevent `i16` overflow.
    pub span_deci_c: i32,
}

/// **Move Semantics**: Takes ownership of `raw_label: String` to construct a `SensorRecord`.
///
/// C/C++ note: Unlike C++ where passing `std::string` by value copies the heap buffer unless
/// `std::move` is used, Rust moves `String` by default (shallow 24-byte stack copy of
/// `{ptr, len, cap}`, and the caller's variable is statistically invalidated at compile time
/// to prevent double-free or use-after-move).
///
/// By contrast, `channel: u8` implements the `Copy` trait because it is a plain stack scalar
/// with no heap resources, so the caller can continue using its `u8` variable after this call.
pub fn claim_sensor_label(raw_label: String, channel: u8) -> SensorRecord {
    SensorRecord {
        label: raw_label,
        channel,
        calibration_offset_deci_c: 0,
        last_calibrated_deci_c: 0,
        sample_count: 0,
    }
}

/// Demonstrates moving a `String` while reusing a `Copy` scalar (`u8`).
pub fn demonstrate_move_vs_copy() -> (SensorRecord, u8) {
    let allocated_label = String::from("MCU-CH3-THERM");
    let adc_channel: u8 = 3;

    // `allocated_label` is moved into `claim_sensor_label` and cannot be used after this line.
    // `adc_channel` is `Copy` (`u8`), so a bitwise copy is passed and `adc_channel` stays valid.
    let record = claim_sensor_label(allocated_label, adc_channel);

    (record, adc_channel)
}

/// **Shared Borrowing**: Inspects a sensor label via an immutable string slice (`&str`)
/// without taking ownership of the underlying `String` or static buffer.
///
/// C/C++ note: `&str` is a non-owning "fat pointer" (`{const u8*, usize}`), similar to
/// C++17 `std::string_view`, but statically guaranteed by the borrow checker never to dangle.
pub fn inspect_sensor_label(label: &str) -> LabelInspection {
    let byte_len = label.len();
    let has_standard_prefix = label.starts_with("MCU-") || label.starts_with("SENS-");
    let is_valid_ascii_tag = !label.is_empty()
        && label
            .bytes()
            .all(|b| b.is_ascii_uppercase() || b.is_ascii_digit() || b == b'-');

    LabelInspection {
        byte_len,
        has_standard_prefix,
        is_valid_ascii_tag,
    }
}

/// **Mutable Borrowing**: Updates a `SensorRecord` in place through an exclusive `&mut` reference.
///
/// C/C++ note: Rust enforces aliasing XOR mutability—while `record: &mut SensorRecord` is active,
/// no other reference (mutable or immutable) to the same `SensorRecord` may coexist.
pub fn apply_calibrated_sample(
    record: &mut SensorRecord,
    new_offset_deci_c: i16,
    raw_reading_deci_c: i16,
) {
    record.calibration_offset_deci_c = new_offset_deci_c;
    record.last_calibrated_deci_c = raw_reading_deci_c.saturating_add(new_offset_deci_c);
    record.sample_count += 1;
}

/// Demonstrates Rust's borrowing exclusivity rules:
/// multiple simultaneous `&SensorRecord` readers are permitted, and once their last read
/// completes, an exclusive `&mut SensorRecord` borrow can mutate the record.
pub fn observe_then_update_record(
    record: &mut SensorRecord,
    raw_reading_deci_c: i16,
) -> (usize, i16) {
    // Multiple immutable borrows can coexist safely because neither can mutate `*record`.
    let reader_a: &SensorRecord = &*record;
    let reader_b: &SensorRecord = &*record;
    let combined_check =
        reader_a.label.len() + usize::from(reader_b.channel) + (reader_a.sample_count as usize);

    // `reader_a` and `reader_b` are no longer used below (Non-Lexical Lifetimes),
    // so we can now take an exclusive `&mut` borrow to update `record`.
    apply_calibrated_sample(record, record.calibration_offset_deci_c, raw_reading_deci_c);

    (combined_check, record.last_calibrated_deci_c)
}

/// **Slices**: Summarizes a contiguous sequence of `i16` readings without taking ownership.
///
/// Accepts any `&[i16]`—whether borrowed from a `Vec<i16>`, a fixed-size stack array `[i16; N]`,
/// or a sub-window `&readings[start..end]`. Returns `None` if the slice is empty.
pub fn summarize_reading_slice(readings: &[i16]) -> Option<SliceSummary> {
    let (&first, rest) = readings.split_first()?;

    let mut min_deci_c = first;
    let mut max_deci_c = first;

    for &sample in rest {
        if sample < min_deci_c {
            min_deci_c = sample;
        }
        if sample > max_deci_c {
            max_deci_c = sample;
        }
    }

    let span_deci_c = i32::from(max_deci_c) - i32::from(min_deci_c);

    Some(SliceSummary {
        count: readings.len(),
        min_deci_c,
        max_deci_c,
        span_deci_c,
    })
}

/// **Lifetimes**: Returns the longer (more detailed) of two sensor label slices,
/// or `primary` when both have the same byte length.
///
/// C/C++ note: The lifetime parameter `'a` does NOT change how long `primary` or `fallback`
/// lives in memory. Instead, `'a` tells the compiler that the returned `&str` borrows from
/// either `primary` or `fallback`, so the returned reference is valid only for the overlap
/// (the shorter) of the two inputs' lifetimes. Without `'a`, the compiler cannot know which
/// input reference the output is tied to.
pub fn select_more_detailed_label<'a>(primary: &'a str, fallback: &'a str) -> &'a str {
    if primary.len() >= fallback.len() {
        primary
    } else {
        fallback
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn moves_string_into_record_while_copy_scalar_remains_usable() {
        let (record, channel_after_call) = demonstrate_move_vs_copy();

        assert_eq!(record.label, "MCU-CH3-THERM");
        assert_eq!(record.channel, 3);
        assert_eq!(channel_after_call, 3);
    }

    #[test]
    fn inspects_sensor_labels_by_shared_borrow_without_consuming_string() {
        let owned_label = String::from("SENS-42");

        let first_pass = inspect_sensor_label(&owned_label);
        let second_pass = inspect_sensor_label(&owned_label);

        // `owned_label` is still owned by this test and usable after multiple `&str` borrows.
        assert_eq!(owned_label, "SENS-42");
        assert_eq!(first_pass, second_pass);
        assert_eq!(
            first_pass,
            LabelInspection {
                byte_len: 7,
                has_standard_prefix: true,
                is_valid_ascii_tag: true,
            }
        );

        // Boundary cases: empty label, non-standard prefix, and lowercase/invalid characters.
        let empty = inspect_sensor_label("");
        assert_eq!(empty.byte_len, 0);
        assert!(!empty.has_standard_prefix);
        assert!(!empty.is_valid_ascii_tag);

        let custom_prefix = inspect_sensor_label("AUX-01");
        assert!(!custom_prefix.has_standard_prefix);
        assert!(custom_prefix.is_valid_ascii_tag);

        let invalid_chars = inspect_sensor_label("MCU-ch1!");
        assert!(invalid_chars.has_standard_prefix);
        assert!(!invalid_chars.is_valid_ascii_tag);
    }

    #[test]
    fn mutates_sensor_record_in_place_and_respects_aliasing_rules() {
        let mut record = claim_sensor_label(String::from("MCU-01"), 1);

        apply_calibrated_sample(&mut record, -15, 300);
        assert_eq!(record.calibration_offset_deci_c, -15);
        assert_eq!(record.last_calibrated_deci_c, 285);
        assert_eq!(record.sample_count, 1);

        let (check_before_update, calibrated) = observe_then_update_record(&mut record, 415);
        // label len (6) + channel (1) + previous sample_count (1) == 8
        assert_eq!(check_before_update, 8);
        assert_eq!(calibrated, 400);
        assert_eq!(record.sample_count, 2);

        // Boundary case: saturating_add prevents i16 overflow on extreme calibration offset.
        apply_calibrated_sample(&mut record, 100, i16::MAX);
        assert_eq!(record.last_calibrated_deci_c, i16::MAX);
    }

    #[test]
    fn summarizes_non_empty_and_empty_slices_without_taking_ownership() {
        let buffer: Vec<i16> = vec![180, 240, 310, 290, 520];

        // Borrow the entire Vec as a slice `&[i16]`.
        let full_summary = summarize_reading_slice(&buffer).expect("non-empty slice");
        assert_eq!(
            full_summary,
            SliceSummary {
                count: 5,
                min_deci_c: 180,
                max_deci_c: 520,
                span_deci_c: 340,
            }
        );

        // Borrow a sub-window slice `&buffer[1..4]` (`[240, 310, 290]`).
        let window_summary = summarize_reading_slice(&buffer[1..4]).expect("non-empty window");
        assert_eq!(
            window_summary,
            SliceSummary {
                count: 3,
                min_deci_c: 240,
                max_deci_c: 310,
                span_deci_c: 70,
            }
        );

        // `buffer` is still owned by the caller after multiple slice borrows.
        assert_eq!(buffer.len(), 5);

        // Boundary cases: empty slice returns `None`, single-element slice has 0 span,
        // and extreme `i16::MIN` to `i16::MAX` span does not overflow `i32`.
        assert_eq!(summarize_reading_slice(&[]), None);

        let single = summarize_reading_slice(&[420]).expect("single element");
        assert_eq!(single.count, 1);
        assert_eq!(single.span_deci_c, 0);

        let extremes = summarize_reading_slice(&[i16::MIN, i16::MAX]).expect("extremes");
        assert_eq!(
            extremes.span_deci_c,
            i32::from(i16::MAX) - i32::from(i16::MIN)
        );
    }

    #[test]
    fn selects_more_detailed_label_across_different_and_nested_lifetimes() {
        let short_label = "MCU-1";
        let detailed_label = "MCU-1-EXHAUST-MANIFOLD";

        assert_eq!(
            select_more_detailed_label(short_label, detailed_label),
            "MCU-1-EXHAUST-MANIFOLD"
        );
        assert_eq!(
            select_more_detailed_label(detailed_label, short_label),
            "MCU-1-EXHAUST-MANIFOLD"
        );

        // Boundary case: equal-length labels return `primary`.
        assert_eq!(select_more_detailed_label("SENS-A", "SENS-B"), "SENS-A");

        // Demonstrate lifetime relationship across nested scopes:
        // `selected` is valid inside the inner scope where both `outer` and `inner` are live.
        let outer = String::from("SENS-01");
        {
            let inner = String::from("SENS-01-COLD-JUNCTION");
            let selected = select_more_detailed_label(outer.as_str(), inner.as_str());
            assert_eq!(selected, "SENS-01-COLD-JUNCTION");
        }
    }
}
