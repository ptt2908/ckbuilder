import React from "react";

interface TokenCardProps {
  xudtBalance?: bigint;
  xudtTypeArgs: string;
  setXudtTypeArgs: (val: string) => void;
  myLockHash: string;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  xudtBalance,
  xudtTypeArgs,
  setXudtTypeArgs,
  myLockHash,
}) => {
  const isDefaultLockHash =
    Boolean(myLockHash) &&
    xudtTypeArgs.trim().toLowerCase() === myLockHash.toLowerCase();

  return (
    <div className="studio-card token-card">
      <div className="card-header">
        <div className="card-header-title">
          <span className="card-icon">🪙</span>
          <div>
            <h2>xUDT Token Overview</h2>
            <p className="card-subtitle-sm">
              Live token balance and Type Script configuration
            </p>
          </div>
        </div>
      </div>

      <div className="xudt-balance-hero">
        <div className="balance-info-left">
          <span className="balance-label-sm">Active xUDT Balance</span>
          <div className="balance-val-row">
            <span className="balance-val-lg accent-text">
              {xudtBalance !== undefined
                ? `${xudtBalance.toString()}`
                : "Loading..."}
            </span>
            <span className="balance-unit-badge">xUDT</span>
          </div>
        </div>
      </div>

      <div className="token-config-box">
        <div className="config-box-header">
          <span className="config-title">Token Identity & Type Args</span>
          {isDefaultLockHash && (
            <span className="status-pill committed">Issuer Default</span>
          )}
        </div>

        <label className="field-group">
          <div className="field-header">
            <span>Selected xUDT Type Args</span>
            {myLockHash && !isDefaultLockHash && (
              <button
                type="button"
                className="btn-action-text"
                onClick={() => setXudtTypeArgs(myLockHash)}
              >
                Use My Lock Hash
              </button>
            )}
          </div>
          <input
            type="text"
            className="input-text mono-input"
            value={xudtTypeArgs}
            onChange={(e) => setXudtTypeArgs(e.target.value)}
            placeholder="0x..."
          />
          <p className="field-hint">
            The 32-byte hex Type Args uniquely identifies this xUDT token script on CKB Testnet. Changing this value queries balances and executes operations for that specific token.
          </p>
        </label>
      </div>
    </div>
  );
};
