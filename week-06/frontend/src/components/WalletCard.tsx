import { ccc } from "@ckb-ccc/connector-react";
import React from "react";

interface WalletCardProps {
  walletName?: string;
  address: string;
  balance?: bigint;
  myLockHash: string;
  onDisconnect: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  walletName,
  address,
  balance,
  myLockHash,
  onDisconnect,
}) => {
  return (
    <div className="studio-card wallet-card">
      <div className="card-header">
        <div className="card-header-title">
          <span className="card-icon">👛</span>
          <h2>Wallet Connection</h2>
        </div>
        <button type="button" className="btn-secondary-sm" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>

      <div className="wallet-details-grid">
        <div className="detail-item">
          <span className="detail-label">Provider</span>
          <span className="detail-value">{walletName || "JoyID Wallet"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Network</span>
          <span className="detail-value badge-success">CKB Testnet</span>
        </div>
        <div className="detail-item full-width">
          <span className="detail-label">CKB Address</span>
          <code className="mono-block copyable">{address || "Loading..."}</code>
        </div>
        {myLockHash && (
          <div className="detail-item full-width">
            <span className="detail-label">Lock Script Hash</span>
            <code className="mono-block copyable">{myLockHash}</code>
          </div>
        )}
      </div>

      <div className="ckb-balance-strip">
        <div className="balance-info">
          <span className="balance-label-sm">Native CKB Balance</span>
          <span className="balance-val-lg">
            {balance !== undefined
              ? `${ccc.fixedPointToString(balance)} CKB`
              : "Loading..."}
          </span>
        </div>
      </div>
    </div>
  );
};
