import React from "react";

interface MessageSignCardProps {
  message: string;
  setMessage: (val: string) => void;
  signature: string;
  signType: string;
  verificationResult: string;
  error: string;
  isSigning: boolean;
  signerExists: boolean;
  onSubmit: () => void;
}

export const MessageSignCard: React.FC<MessageSignCardProps> = ({
  message,
  setMessage,
  signature,
  signType,
  verificationResult,
  error,
  isSigning,
  signerExists,
  onSubmit,
}) => {
  return (
    <div className="studio-card">
      <div className="card-header">
        <div className="card-header-title">
          <span className="card-icon">✍️</span>
          <div>
            <h2>Message Signing</h2>
            <p className="card-subtitle-sm">
              Cryptographically sign arbitrary data off-chain with JoyID passkey
            </p>
          </div>
        </div>
        <div className="offchain-badge">Off-chain Operation</div>
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
            <span>Message to Sign</span>
            <span className="field-type-tag">Plaintext String</span>
          </div>
          <input
            type="text"
            className="input-text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hello CKBuilders!"
            disabled={isSigning}
          />
        </label>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={!signerExists || isSigning || !message.trim()}
          >
            {isSigning ? (
              <span className="loading-spinner-label">
                <span className="spinner-icon">🔄</span> Signing Message...
              </span>
            ) : (
              "Sign & Verify Message"
            )}
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="alert-message alert-error">
          <div className="alert-header">
            <span className="alert-icon">⚠️</span>
            <strong>Signing Error</strong>
          </div>
          <p className="alert-body">{error}</p>
        </div>
      )}

      {(signType || signature || verificationResult) && (
        <div className="query-results-box">
          <div className="results-box-header">Signature & Verification Details</div>
          {signType && (
            <div className="result-row">
              <span className="result-label">Sign Algorithm</span>
              <span className="result-value badge-status">{signType}</span>
            </div>
          )}
          {signature && (
            <div className="result-row vertical">
              <span className="result-label">Output Signature</span>
              <code className="mono-block copyable">{signature}</code>
            </div>
          )}
          {verificationResult && (
            <div className="result-row">
              <span className="result-label">Verification Result</span>
              <span
                className={`result-value ${
                  verificationResult.includes("Valid")
                    ? "badge-success"
                    : "badge-error"
                }`}
              >
                {verificationResult}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
