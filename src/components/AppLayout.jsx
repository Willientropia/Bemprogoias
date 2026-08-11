import { Sidebar } from "./Sidebar";

export function AppLayout({ title, subtitle, children }) {
  return (
    <div className="app-shell" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, background: "var(--page-bg)", overflowY: "auto" }}>
        <div style={{ maxWidth: 1080, padding: "38px clamp(20px, 4vw, 44px) 56px" }}>
          {title && (
            <div style={{ marginBottom: 28 }}>
              <h1>{title}</h1>
              {subtitle && <p style={{ marginTop: 6, fontSize: 14.5 }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
