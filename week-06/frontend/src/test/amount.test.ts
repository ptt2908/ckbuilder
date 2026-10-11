import { describe, expect, it } from "vitest";
import { MAX_UINT128, isValidUdtAmount } from "../utils/amount";

describe("amount utilities", () => {
  describe("MAX_UINT128", () => {
    it("equals 2^128 - 1", () => {
      expect(MAX_UINT128).toBe((1n << 128n) - 1n);
      expect(MAX_UINT128).toBe(340282366920938463463374607431768211455n);
      expect(MAX_UINT128.toString(16)).toBe("ffffffffffffffffffffffffffffffff");
    });
  });

  describe("isValidUdtAmount", () => {
    it("accepts positive amounts within the 128-bit unsigned integer range", () => {
      expect(isValidUdtAmount(1n)).toBe(true);
      expect(isValidUdtAmount(100n)).toBe(true);
      expect(isValidUdtAmount(1_000_000_000_000_000_000n)).toBe(true);
      expect(isValidUdtAmount(MAX_UINT128 - 1n)).toBe(true);
    });

    it("accepts the exact MAX_UINT128 upper boundary", () => {
      expect(isValidUdtAmount(MAX_UINT128)).toBe(true);
    });

    it("rejects zero", () => {
      expect(isValidUdtAmount(0n)).toBe(false);
    });

    it("rejects negative values", () => {
      expect(isValidUdtAmount(-1n)).toBe(false);
      expect(isValidUdtAmount(-100n)).toBe(false);
      expect(isValidUdtAmount(-MAX_UINT128)).toBe(false);
    });

    it("rejects values above MAX_UINT128", () => {
      expect(isValidUdtAmount(MAX_UINT128 + 1n)).toBe(false);
      expect(isValidUdtAmount(1n << 128n)).toBe(false);
      expect(isValidUdtAmount(MAX_UINT128 * 2n)).toBe(false);
    });
  });
});
