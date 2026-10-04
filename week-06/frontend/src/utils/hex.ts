/**
 * Validates whether the given value is a valid 32-byte hex string starting with 0x.
 * Matches exact Testnet lock hashes and xUDT Type Args format.
 */
export const isValidTypeArgs = (value: string | null | undefined): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  return /^0x[0-9a-fA-F]{64}$/.test(trimmed);
};

/**
 * Normalizes a hex string by trimming and ensuring a lowercase 0x prefix.
 */
export const normalizeHexArgs = (input: string): string => {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
};
