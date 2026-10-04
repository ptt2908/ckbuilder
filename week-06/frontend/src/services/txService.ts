import { ccc } from "@ckb-ccc/connector-react";

export interface TransactionQueryResult {
  status: string;
  blockNumber: string;
}

/**
 * Fetches transaction status and block information from CKB network.
 * 
 * @param client CCC client instance
 * @param txHash 32-byte transaction hash hex string
 * @returns TransactionQueryResult or null if transaction is not found
 */
export async function queryTransaction(
  client: ccc.Client,
  txHash: string,
): Promise<TransactionQueryResult | null> {
  const formattedHash = txHash.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(formattedHash)) {
    throw new Error(
      "Invalid transaction hash. Expected a 32-byte hash starting with 0x.",
    );
  }

  const transaction = await client.getTransaction(formattedHash);
  if (!transaction) {
    return null;
  }

  return {
    status: transaction.status,
    blockNumber:
      transaction.blockNumber !== undefined
        ? transaction.blockNumber.toString()
        : "Pending / not yet confirmed",
  };
}
