import React from "react";
import { getExplorerTxUrl } from "../config/network";

interface MintFormProps {
  recipient: string;
  setRecipient: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  isMinting: boolean;
  error: string;
  txHash: string;
  myLockHash: string;
  xudtTypeArgs: string;
  connectedAddress: string;
  onSubmit: () => void;
}

export const MintForm: React.FC<MintFormProps> = ({
  recipient,
  setRecipient,
  amount,
  setAmount,
  isMinting,
  error,
  txHash,
  myLockHash,
  xudtTypeArgs,
  connectedAddress,
  onSubmit,
}) => {
  const isAuthorizedIssuer =
    Boolean(myLockHash) &&
    Boolean(xudtTypeArgs.trim()) &&
    xudtTypeArgs.trim().toLowerCase() === myLockHash.toLowerCase();

  const isIssuerMismatch =
    Boolean(myLockHash) &&
    Boolean(xudtTypeArgs.trim()) &&
    xudtTypeArgs.trim().toLowerCase() !== myLockHash.toLowerCase();

  return (
    <div className="studio-card token-op-card">
      <div className="card-header">
        <div className="card-header-title">
          <span className="card-icon">🏗️</span>
          <div>
            <h2>Mint xUDT</h2>
            <p className="card-subtitle-sm">Issue new tokens into target wallet address</p>
          </div>
        </div>

        {isAuthorizedIssuer && (
          <div className="status-badge-authorized">
            <span>✓ Issuer Authorized</span>
          </div>
        )}
      </div>

      {isIssuerMismatch && (
        <div className="alert-message alert-warning">
          <div className="alert-header">
            <span className="alert-icon">⚠️</span>
            <strong>Issuer Mismatch Warning</strong>
          </div>
          <p className="alert-body">
            Connected wallet lock hash does not match the selected xUDT Type Args. Minting will be rejected by the authorization guard unless Type Args matches your wallet lock hash.
          </p>
        </div>
      )}

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
            {connectedAddress && (
              <button
                type="button"
                className="btn-action-text"
                onClick={() => setRecipient(connectedAddress)}
                disabled={isMinting}
              >
                Use My Address
              </button>
            )}
          </div>
          <input
            type="text"
            className="input-text mono-input"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="ckt1..."
            disabled={isMinting}
          />
        </label>

        <label className="field-group">
          <div className="field-header">
            <span>Mint Amount</span>
            <span className="field-type-tag">Max UINT128</span>
          </div>
          <div className="input-with-suffix">
            <input
              type="number"
              min="1"
              step="1"
              className="input-text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              disabled={isMinting}
            />
            <span className="input-suffix">xUDT</span>
          </div>
        </label>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary btn-full-width"
            disabled={isMinting || !recipient.trim() || !amount.trim()}
          >
            {isMinting ? (
              <span className="loading-spinner-label">
                <span className="spinner-icon">🔄</span> Minting Tokens...
              </span>
            ) : (
              "Mint xUDT Tokens"
            )}
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="alert-message alert-error">
          <div className="alert-header">
            <span className="alert-icon">⚠️</span>
            <strong>Mint Failed</strong>
          </div>
          <p className="alert-body">{error}</p>
        </div>
      )}

      {txHash && (
        <div className="alert-message alert-success">
          <div className="alert-header">
            <span className="alert-icon">✅</span>
            <strong>Mint Transaction Committed</strong>
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
