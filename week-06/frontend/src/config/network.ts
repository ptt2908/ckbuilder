const DEFAULT_NETWORK_NAME = "CKB Testnet";
const DEFAULT_NETWORK_ID = "ckb_testnet";
const DEFAULT_EXPLORER_URL = "https://v1.testnet.explorer.nervos.org";

const readEnvString = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

export const normalizeExplorerBaseUrl = (url: unknown): string => {
  const resolved = readEnvString(url, DEFAULT_EXPLORER_URL);
  return resolved.replace(/\/+$/, "");
};

export const CKB_NETWORK_NAME = readEnvString(
  import.meta.env.VITE_CKB_NETWORK_NAME,
  DEFAULT_NETWORK_NAME,
);

export const CKB_DEFAULT_NETWORK_ID = readEnvString(
  import.meta.env.VITE_CKB_NETWORK_ID,
  DEFAULT_NETWORK_ID,
);

export const CKB_TESTNET_EXPLORER_URL = normalizeExplorerBaseUrl(
  import.meta.env.VITE_CKB_EXPLORER_URL,
);

export const CKB_RPC_URL = readEnvString(
  import.meta.env.VITE_CKB_RPC_URL,
  "",
);

export const getNetworkLabel = (networkId: string): string => {
  const normalized = networkId.trim();
  if (!normalized || normalized === CKB_DEFAULT_NETWORK_ID) {
    return CKB_NETWORK_NAME;
  }
  if (normalized === "ckb_mainnet") {
    return "CKB Mainnet";
  }
  return normalized;
};

export const getExplorerTxUrl = (
  txHash: string,
  explorerBaseUrl: string = CKB_TESTNET_EXPLORER_URL,
): string => {
  const base = normalizeExplorerBaseUrl(explorerBaseUrl);
  return `${base}/transaction/${txHash.trim()}`;
};
