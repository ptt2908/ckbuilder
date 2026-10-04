import React, { useState } from "react";
import { getExplorerTxUrl } from "../config/network";
import type { TransactionHistoryItem } from "../types/transaction";

interface TxHistoryCardProps {
  history: TransactionHistoryItem[];
  onCheckTx: (hash: string) => void;
  onClearHistory: () => void;
}

export const TxHistoryCard: React.FC<TxHistoryCardProps> = ({
  history,
  onCheckTx,
  onClearHistory,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  return (
    <div className="studio-card">
      <div className="card-header">
        <div className="card-header-title">
          <span className="card-icon">📜</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2>Transaction History</h2>
              <span className="history-count-pill">{history.length}</span>
            </div>
            <p className="card-subtitle-sm">
              Local record of xUDT transactions submitted from this browser session
            </p>
          </div>
        </div>
        {history.length > 0 && !showConfirmClear && (
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={() => setShowConfirmClear(true)}
          >
            Clear History
          </button>
        )}
        {showConfirmClear && (
          <div className="delete-confirm-group" style={{ margin: 0 }}>
            <span className="confirm-label">Clear local history?</span>
            <button
              type="button"
              className="btn-action-danger btn-sm"
              onClick={() => {
                onClearHistory();
                setShowConfirmClear(false);
              }}
            >
              Confirm Clear
            </button>
            <button
              type="button"
              className="btn-action-text btn-sm cancel"
              onClick={() => setShowConfirmClear(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>📜</span>
          No locally recorded transactions yet.
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-card-item">
              <div className="history-item-top">
                <span className="action-tag">{item.action}</span>
                <span
                  className={`status-pill ${
                    item.status === "Committed" ? "committed" : "submitted"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="history-item-body">
                <div className="history-field">
                  <span className="label">Timestamp:</span>
                  <span className="val">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="history-field">
                  <span className="label">Tx Hash:</span>
                  <code className="mono-block copyable">{item.txHash}</code>
                </div>
              </div>
              <div className="history-item-actions">
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => onCheckTx(item.txHash)}
                >
                  Check Status
                </button>
                <a
                  href={getExplorerTxUrl(item.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-link-sm"
                >
                  View Explorer ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
