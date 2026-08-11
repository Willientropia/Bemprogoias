import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../config/roles";

const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.MANAGER]: "Gestor",
  [ROLES.LEADER]: "Líder",
};

const navItemStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "11px 14px",
  borderRadius: 11,
  fontSize: 14,
  fontWeight: isActive ? 700 : 500,
  background: isActive ? "var(--gold)" : "transparent",
  color: isActive ? "var(--brand-900)" : "rgba(255,255,255,.78)",
  textDecoration: "none",
  transition: "all .18s",
});

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

export function Sidebar() {
  const { user, role, logout } = useAuth();
  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <aside
      className="app-sidebar"
      style={{
        width: 248,
        flexShrink: 0,
        background: "var(--brand-900)",
        display: "flex",
        flexDirection: "column",
        padding: "22px 16px",
        color: "#fff",
      }}
    >
      <div
        className="sidebar-brand"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "6px 8px 22px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: "#fff",
            borderRadius: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: 4,
          }}
        >
          <img src="/logo-mark.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div className="sidebar-brand-text">
          <div style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 14.5, letterSpacing: 0.4, lineHeight: 1.05 }}>
            BEM PARA GOIÁS
          </div>
          <div style={{ fontSize: 7.5, letterSpacing: 1.3, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
            MANDATO COM PARTICIPAÇÃO PÚBLICA
          </div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {role === ROLES.SUPER_ADMIN && (
          <NavLink to="/super-admin" style={navItemStyle}>
            <IconHome />
            <span>Campanhas</span>
          </NavLink>
        )}
        {role === ROLES.MANAGER && (
          <NavLink to="/manager" end style={navItemStyle}>
            <IconUsers />
            <span>Líderes</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer" style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--gold)",
              color: "var(--brand-900)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div className="sidebar-footer-info" style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.email}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>{ROLE_LABELS[role] ?? role}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sair"
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,.45)",
              padding: 4,
              display: "flex",
              cursor: "pointer",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
