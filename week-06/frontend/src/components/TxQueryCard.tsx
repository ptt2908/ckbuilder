import React from "react";
import { getExplorerTxUrl } from "../config/network";

interface TxQueryCardProps {
  txHash: string;
  setTxHash: (val: string) => void;
  status: string;
  block: string;
  error: string;
  isQuerying: boolean;
  signerExists: boolean;
  onSubmit: () => void;
}

export const TxQueryCard: React.FC<TxQueryCardProps> = ({
  txHash,
  setTxHash,
  status,
  block,
  error,
  isQuerying,
  signerExists,
  onSubmit,
}) => {
  return (
    <div className="studio-card">
      <div className="card-header">
        <div className="card-header-title">
          <span className="card-icon">🔍</span>
          <h2>Transaction Query</h2>
        </div>
      </div>

      <p className="card-description">
        Query live transaction status and block confirmation info from CKB Testnet by transaction hash.
      </p>

      <form
        className="form-section"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="field-group">
          <span>Transaction Hash</span>
          <input
            type="text"
            className="input-text mono-input"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x..."
          />
        </label>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={!signerExists || isQuerying || !txHash.trim()}
          >
            {isQuerying ? "Querying Network..." : "Query Transaction"}
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="alert-message alert-error">
          <div className="alert-header">
            <span className="alert-icon">⚠️</span>
            <strong>Query Error</strong>
          </div>
          <p className="alert-body">{error}</p>
        </div>
      )}

      {status && (
        <div className="query-results-box">
          <div className="result-row">
            <span className="result-label">Status</span>
            <span className={`result-value badge-status ${status.toLowerCase()}`}>
              {status}
            </span>
          </div>
          {block && (
            <div className="result-row">
              <span className="result-label">Block</span>
              <span className="result-value">{block}</span>
            </div>
          )}
          {txHash.trim() && /^0x[0-9a-fA-F]{64}$/.test(txHash.trim()) && (
            <div className="explorer-link-wrap" style={{ marginTop: "6px" }}>
              <a
                href={getExplorerTxUrl(txHash.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="explorer-link"
              >
                View on CKB Testnet Explorer ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
