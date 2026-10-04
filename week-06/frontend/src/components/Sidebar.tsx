import React, { useEffect } from "react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileNavOpen,
  setMobileNavOpen,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "tokens", label: "Token Studio", icon: "🪙" },
    { id: "transactions", label: "Transactions", icon: "📜" },
    { id: "tools", label: "Developer Tools", icon: "🛠️" },
  ];

  // Handle Escape key listener for closing mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen, setMobileNavOpen]);

  // Close mobile drawer automatically if resized to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 960 && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileNavOpen, setMobileNavOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const handleSelect = (id: string) => {
    onTabChange(id);
    setMobileNavOpen(false);
  };

  return (
    <>
      {mobileNavOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        id="app-sidebar"
        className={`sidebar ${mobileNavOpen ? "open" : ""}`}
        aria-label="Application Sidebar"
      >
        <div className="sidebar-brand">
          <div className="brand-icon">⚡</div>
          <div className="brand-text">
            <span className="brand-title">CKB Studio</span>
            <span className="brand-subtitle">xUDT Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">NAVIGATION</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => handleSelect(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="network-pill">
            <span className="status-dot online" />
            <span className="network-name">CKB Testnet</span>
          </div>
        </div>
      </aside>
    </>
  );
};
