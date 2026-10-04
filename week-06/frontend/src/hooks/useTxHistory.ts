import { useEffect, useState } from "react";
import { HISTORY_STORAGE_KEY } from "../config/storageKeys";
import type { TransactionHistoryItem } from "../types/transaction";

export function useTxHistory() {
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as TransactionHistoryItem[]) : [];
    } catch (error) {
      console.warn("Could not restore transaction history:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(transactionHistory),
      );
    } catch (error) {
      console.warn("Could not persist transaction history:", error);
    }
  }, [transactionHistory]);

  const recordTransaction = (
    action: TransactionHistoryItem["action"],
    txHash: string,
  ) => {
    setTransactionHistory((current) => [
      {
        id: `${txHash}-${action}`,
        action,
        txHash,
        status: "Submitted",
        timestamp: new Date().toISOString(),
      },
      ...current.filter((item) => item.txHash !== txHash),
    ]);
  };

  const updateTransactionStatus = (
    txHash: string,
    status: TransactionHistoryItem["status"],
  ) => {
    setTransactionHistory((current) =>
      current.map((item) =>
        item.txHash === txHash ? { ...item, status } : item,
      ),
    );
  };

  const clearHistory = () => {
    setTransactionHistory([]);
  };

  return {
    transactionHistory,
    recordTransaction,
    updateTransactionStatus,
    clearHistory,
  };
}
