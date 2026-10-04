import React from "react";
import { getExplorerTxUrl } from "../config/network";

interface TransferFormProps {
  recipient: string;
  setRecipient: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  isTransferring: boolean;
  error: string;
  txHash: string;
  xudtBalance?: bigint;
  onSubmit: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  recipient,
  setRecipient,
  amount,
  setAmount,
  isTransferring,
  error,
  txHash,
  xudtBalance,
  onSubmit,
}) => {
  return (
    <div className="studio-card token-op-card">
      <div className="card-header">
        <div className="card-header-title">
          <span className="card-icon">💸</span>
          <div>
            <h2>Transfer xUDT</h2>
            <p className="card-subtitle-sm">Send tokens to any CKB recipient address</p>
          </div>
        </div>
        {xudtBalance !== undefined && (
          <div className="balance-pill-badge">
            <span className="pill-label">Available:</span>
            <span className="pill-val">{xudtBalance.toString()} xUDT</span>
          </div>
        )}
      </div>

      <form
        className="form-section"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="field-group">
          <div className="field-header">
            <span>Recipient Address</span>
            <span className="field-type-tag">CKB Address (ckt1...)</span>
          </div>
          <input
            type="text"
            className="input-text mono-input"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="ckt1..."
            disabled={isTransferring}
          />
        </label>

        <label className="field-group">
          <div className="field-header">
            <span>Transfer Amount</span>
            {xudtBalance !== undefined && xudtBalance > 0n && (
              <button
                type="button"
                className="btn-action-text"
                onClick={() => setAmount(xudtBalance.toString())}
                disabled={isTransferring}
              >
                Max ({xudtBalance.toString()})
              </button>
            )}
          </div>
          <div className="input-with-suffix">
            <input
              type="number"
              min="1"
              step="1"
              className="input-text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10"
              disabled={isTransferring}
            />
            <span className="input-suffix">xUDT</span>
          </div>
        </label>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary btn-full-width"
            disabled={isTransferring || !recipient.trim() || !amount.trim()}
          >
            {isTransferring ? (
              <span className="loading-spinner-label">
                <span className="spinner-icon">🔄</span> Transferring xUDT...
              </span>
            ) : (
              "Confirm & Transfer xUDT"
            )}
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="alert-message alert-error">
          <div className="alert-header">
            <span className="alert-icon">⚠️</span>
            <strong>Transfer Failed</strong>
          </div>
          <p className="alert-body">{error}</p>
        </div>
      )}

      {txHash && (
        <div className="alert-message alert-success">
          <div className="alert-header">
            <span className="alert-icon">✅</span>
            <strong>Transaction Committed</strong>
          </div>
          <code className="mono-block copyable">{txHash}</code>
          <div className="explorer-link-wrap">
            <a
              href={getExplorerTxUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View on CKB Testnet Explorer ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
