export const CKB_NETWORK_NAME = "CKB Testnet";
export const CKB_TESTNET_EXPLORER_URL = "https://v1.testnet.explorer.nervos.org";

export const getExplorerTxUrl = (txHash: string): string => {
  return `${CKB_TESTNET_EXPLORER_URL}/transaction/${txHash}`;
};
