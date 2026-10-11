import { describe, expect, it } from "vitest";
import { MAX_UINT128, isValidUdtAmount } from "../utils/amount";

describe("Testing Foundation", () => {
  it("executes minimal utility assertion to verify Vitest configuration", () => {
    expect(MAX_UINT128).toBeGreaterThan(0n);
    expect(isValidUdtAmount(100n)).toBe(true);
  });
});
