import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
// Ver comentário em Sidebar.jsx: caminho absoluto quebra no Electron (file://).
import logoMark from "../assets/logo-mark.png";

const SIDEBAR_STORAGE_KEY = "bemparagoias.sidebarCollapsed";

function initialCollapsedState() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

export function AppLayout({
  title,
  subtitle,
  children,
  sidebarItems,
  activeSidebarItem,
  onSidebarItemChange,
  sidebarContextLabel,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsedState);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  function selectSidebarItem(itemId) {
    onSidebarItemChange?.(itemId);
    setMobileSidebarOpen(false);
  }

  return (
    <div className={`app-shell${sidebarCollapsed ? " sidebar-is-collapsed" : ""}`}>
      <Sidebar
        items={sidebarItems}
        activeItem={activeSidebarItem}
        onItemSelect={selectSidebarItem}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        contextLabel={sidebarContextLabel}
      />

      {mobileSidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <main className="app-main">
        <div className="mobile-app-bar">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Abrir menu"
            aria-expanded={mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <img src={logoMark} alt="" />
          <span>Bem para Goiás</span>
        </div>

        <div className="app-content">
          {title && (
            <div style={{ marginBottom: 28 }}>
              <h1>{title}</h1>
              {subtitle && <p style={{ marginTop: 6, fontSize: 14.5 }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
