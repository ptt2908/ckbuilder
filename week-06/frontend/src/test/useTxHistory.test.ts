import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HISTORY_STORAGE_KEY } from "../config/storageKeys";
import { useTxHistory } from "../hooks/useTxHistory";
import type { TransactionHistoryItem } from "../types/transaction";

const TX_HASH_1 =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TX_HASH_2 =
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

describe("useTxHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("initializes with an empty history when localStorage is empty", () => {
    const { result } = renderHook(() => useTxHistory());

    expect(result.current.transactionHistory).toEqual([]);
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBe("[]");
  });

  it("restores saved transaction history from localStorage on mount", () => {
    const savedHistory: TransactionHistoryItem[] = [
      {
        id: `${TX_HASH_1}-Mint xUDT`,
        action: "Mint xUDT",
        txHash: TX_HASH_1,
        status: "Committed",
        timestamp: "2026-01-01T00:00:00.000Z",
      },
    ];
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(savedHistory));

    const { result } = renderHook(() => useTxHistory());

    expect(result.current.transactionHistory).toEqual(savedHistory);
  });

  it("falls back to an empty array when stored JSON is malformed", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(HISTORY_STORAGE_KEY, "{invalid-json");

    const { result } = renderHook(() => useTxHistory());

    expect(result.current.transactionHistory).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("records transactions in newest-first order with Submitted status and persists to localStorage", () => {
    const { result } = renderHook(() => useTxHistory());

    act(() => {
      result.current.recordTransaction("Mint xUDT", TX_HASH_1);
    });
    act(() => {
      result.current.recordTransaction("Transfer xUDT", TX_HASH_2);
    });

    expect(result.current.transactionHistory).toHaveLength(2);
    expect(result.current.transactionHistory[0]).toMatchObject({
      id: `${TX_HASH_2}-Transfer xUDT`,
      action: "Transfer xUDT",
      txHash: TX_HASH_2,
      status: "Submitted",
    });
    expect(result.current.transactionHistory[1]).toMatchObject({
      id: `${TX_HASH_1}-Mint xUDT`,
      action: "Mint xUDT",
      txHash: TX_HASH_1,
      status: "Submitted",
    });

    const persisted = JSON.parse(
      localStorage.getItem(HISTORY_STORAGE_KEY) ?? "[]",
    ) as TransactionHistoryItem[];
    expect(persisted).toHaveLength(2);
    expect(persisted[0].txHash).toBe(TX_HASH_2);
    expect(persisted[1].txHash).toBe(TX_HASH_1);
  });

  it("deduplicates entries with the same txHash and moves the re-recorded entry to the top", () => {
    const { result } = renderHook(() => useTxHistory());

    act(() => {
      result.current.recordTransaction("Mint xUDT", TX_HASH_1);
      result.current.updateTransactionStatus(TX_HASH_1, "Committed");
      result.current.recordTransaction("Transfer xUDT", TX_HASH_2);
    });

    act(() => {
      result.current.recordTransaction("Mint xUDT", TX_HASH_1);
    });

    expect(result.current.transactionHistory).toHaveLength(2);
    expect(result.current.transactionHistory[0]).toMatchObject({
      id: `${TX_HASH_1}-Mint xUDT`,
      action: "Mint xUDT",
      txHash: TX_HASH_1,
      status: "Submitted",
    });
    expect(result.current.transactionHistory[1].txHash).toBe(TX_HASH_2);
  });

  it("updates transaction status by txHash and persists the change", () => {
    const { result } = renderHook(() => useTxHistory());

    act(() => {
      result.current.recordTransaction("Mint xUDT", TX_HASH_1);
      result.current.recordTransaction("Transfer xUDT", TX_HASH_2);
    });

    act(() => {
      result.current.updateTransactionStatus(TX_HASH_1, "Committed");
    });

    const updatedItem = result.current.transactionHistory.find(
      (item) => item.txHash === TX_HASH_1,
    );
    const untouchedItem = result.current.transactionHistory.find(
      (item) => item.txHash === TX_HASH_2,
    );

    expect(updatedItem?.status).toBe("Committed");
    expect(untouchedItem?.status).toBe("Submitted");

    const persisted = JSON.parse(
      localStorage.getItem(HISTORY_STORAGE_KEY) ?? "[]",
    ) as TransactionHistoryItem[];
    expect(
      persisted.find((item) => item.txHash === TX_HASH_1)?.status,
    ).toBe("Committed");
  });

  it("clears all transaction history and persists the empty array", () => {
    const { result } = renderHook(() => useTxHistory());

    act(() => {
      result.current.recordTransaction("Mint xUDT", TX_HASH_1);
      result.current.recordTransaction("Transfer xUDT", TX_HASH_2);
    });
    expect(result.current.transactionHistory).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.transactionHistory).toEqual([]);
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBe("[]");
  });
});
