import React from "react";

interface HeaderProps {
  address: string;
  isConnected: boolean;
  walletName?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  activeTab: string;
  mobileNavOpen: boolean;
  setMobileNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({
  address,
  isConnected,
  walletName,
  onConnect,
  onDisconnect,
  activeTab,
  mobileNavOpen,
  setMobileNavOpen,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case "tokens":
        return "Token Operations";
      case "transactions":
        return "Transaction Explorer & History";
      case "tools":
        return "Developer & Signing Tools";
      case "dashboard":
      default:
        return "Dashboard Overview";
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <header className="app-header-bar">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileNavOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar"
        >
          ☰
        </button>
        <h1 className="header-page-title">{getTabTitle(activeTab)}</h1>
      </div>

      <div className="header-right">
        {isConnected ? (
          <div className="wallet-status-badge">
            <div className="wallet-info-pill">
              <span className="wallet-name">{walletName || "JoyID"}</span>
              <span className="wallet-addr">{truncateAddress(address)}</span>
            </div>
            <button
              type="button"
              className="btn-disconnect-sm"
              onClick={onDisconnect}
              title="Disconnect Wallet"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button type="button" className="btn-connect-primary" onClick={onConnect}>
            Connect JoyID Wallet
          </button>
        )}
      </div>
    </header>
  );
};
