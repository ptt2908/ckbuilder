export type TransactionHistoryItem = {
  id: string;
  action: "Transfer xUDT" | "Mint xUDT";
  txHash: string;
  status: "Submitted" | "Committed";
  timestamp: string;
};
