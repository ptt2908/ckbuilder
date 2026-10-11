export const CKB_NETWORK_NAME = "CKB Testnet";
export const CKB_DEFAULT_NETWORK_ID = "ckb_testnet";
export const CKB_TESTNET_EXPLORER_URL = "https://v1.testnet.explorer.nervos.org";

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

export const getExplorerTxUrl = (txHash: string): string => {
  return `${CKB_TESTNET_EXPLORER_URL}/transaction/${txHash}`;
};
