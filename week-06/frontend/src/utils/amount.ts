export const MAX_UINT128 = (1n << 128n) - 1n;

/**
 * Validates whether the UDT token amount is a positive bigint within the maximum 128-bit unsigned integer range.
 */
export const isValidUdtAmount = (amount: bigint): boolean => {
  return amount > 0n && amount <= MAX_UINT128;
};
