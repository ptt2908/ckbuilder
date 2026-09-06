const BACKEND_URL = "http://localhost:3000";

export interface CkbNetworkInfo {
  network: string;
  addressPrefix: string;
  tip: string;
}

export interface CkbTransactionStatus {
  txHash: string;
  status: string;
  blockNumber: string | null;
  txIndex: string | null;
}

export async function getCkbNetwork(): Promise<CkbNetworkInfo> {
  const response = await fetch(`${BACKEND_URL}/api/ckb/network`);

  if (!response.ok) {
    throw new Error("Failed to fetch CKB network information");
  }

  return response.json();
}

export async function getTransactionStatus(
  txHash: string,
): Promise<CkbTransactionStatus> {
  const response = await fetch(
    `${BACKEND_URL}/api/ckb/transactions/${txHash}/status`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transaction status");
  }

  return response.json();
}
