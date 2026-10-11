import { describe, expect, it } from "vitest";
import { isValidTypeArgs, normalizeHexArgs } from "../utils/hex";

const VALID_LOWER_HEX =
  "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const VALID_UPPER_HEX =
  "0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";
const VALID_MIXED_HEX =
  "0x0123456789AbCdEf0123456789aBcDeF0123456789AbCdEf0123456789aBcDeF";
const UNPREFIXED_64_HEX =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("hex utilities", () => {
  describe("isValidTypeArgs", () => {
    it("accepts valid 32-byte lowercase, uppercase, and mixed-case 0x-prefixed hex strings", () => {
      expect(isValidTypeArgs(VALID_LOWER_HEX)).toBe(true);
      expect(isValidTypeArgs(VALID_UPPER_HEX)).toBe(true);
      expect(isValidTypeArgs(VALID_MIXED_HEX)).toBe(true);
    });

    it("accepts valid 32-byte hex strings with surrounding whitespace", () => {
      expect(isValidTypeArgs(`  ${VALID_LOWER_HEX}  `)).toBe(true);
      expect(isValidTypeArgs(`\n\t${VALID_UPPER_HEX}\n`)).toBe(true);
    });

    it("rejects null, undefined, empty, and whitespace-only inputs", () => {
      expect(isValidTypeArgs(null)).toBe(false);
      expect(isValidTypeArgs(undefined)).toBe(false);
      expect(isValidTypeArgs("")).toBe(false);
      expect(isValidTypeArgs("   \t\n  ")).toBe(false);
    });

    it("rejects strings without a lowercase 0x prefix", () => {
      expect(isValidTypeArgs(UNPREFIXED_64_HEX)).toBe(false);
      expect(isValidTypeArgs(`0X${UNPREFIXED_64_HEX}`)).toBe(false);
    });

    it("rejects hex strings shorter or longer than 32 bytes (64 hex characters)", () => {
      expect(isValidTypeArgs("0x")).toBe(false);
      expect(isValidTypeArgs(VALID_LOWER_HEX.slice(0, -1))).toBe(false);
      expect(isValidTypeArgs(`${VALID_LOWER_HEX}0`)).toBe(false);
    });

    it("rejects strings containing non-hex characters or internal spaces", () => {
      const nonHexChar = `${VALID_LOWER_HEX.slice(0, -1)}g`;
      const internalSpace = `${VALID_LOWER_HEX.slice(0, 10)} ${VALID_LOWER_HEX.slice(11)}`;
      expect(isValidTypeArgs(nonHexChar)).toBe(false);
      expect(isValidTypeArgs(internalSpace)).toBe(false);
    });
  });

  describe("normalizeHexArgs", () => {
    it("returns an empty string for empty or whitespace-only input", () => {
      expect(normalizeHexArgs("")).toBe("");
      expect(normalizeHexArgs("   \t\n ")).toBe("");
    });

    it("trims whitespace and converts uppercase characters to lowercase", () => {
      expect(normalizeHexArgs(`  ${VALID_UPPER_HEX}  `)).toBe(VALID_LOWER_HEX);
      expect(normalizeHexArgs(VALID_MIXED_HEX)).toBe(VALID_LOWER_HEX);
    });

    it("adds a 0x prefix when missing", () => {
      expect(normalizeHexArgs(UNPREFIXED_64_HEX)).toBe(VALID_LOWER_HEX);
      expect(normalizeHexArgs(`  ${UNPREFIXED_64_HEX.toUpperCase()}  `)).toBe(
        VALID_LOWER_HEX,
      );
    });

    it("preserves a single 0x prefix when input starts with 0x or 0X", () => {
      expect(normalizeHexArgs("0xABCDEF")).toBe("0xabcdef");
      expect(normalizeHexArgs("0XABCDEF")).toBe("0xabcdef");
    });

    it("normalizes unprefixed or 0X-prefixed 32-byte hex strings into valid Type Args", () => {
      expect(isValidTypeArgs(normalizeHexArgs(UNPREFIXED_64_HEX))).toBe(true);
      expect(isValidTypeArgs(normalizeHexArgs(`0X${UNPREFIXED_64_HEX}`))).toBe(
        true,
      );
    });
  });
});
