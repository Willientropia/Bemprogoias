import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../config/roles";
// Importadas como módulo, não por caminho absoluto: no Electron a página vem
// de file://, onde "/logo.png" aponta para a raiz do disco e a imagem quebra.
// Assim o Vite gera o caminho correto para cada alvo (web e desktop).
import logoFull from "../assets/logo-full.png";
import logoMark from "../assets/logo-mark.png";

const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.MANAGER]: "Gestor",
  [ROLES.LEADER]: "Líder",
};

function NavIcon({ icon }) {
  if (icon === "map") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" />
      </svg>
    );
  }

  if (icon === "network") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="18" cy="18" r="2.4" /><path d="m8.2 10.9 7.6-3.8m-7.6 6 7.6 3.8" />
      </svg>
    );
  }

  if (icon === "report") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8.5 11.5h7m-7 3h4" />
      </svg>
    );
  }

  if (icon === "voters") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5h11M9 12h11M9 19h11" /><circle cx="4" cy="5" r="1.5" /><circle cx="4" cy="12" r="1.5" /><circle cx="4" cy="19" r="1.5" />
      </svg>
    );
  }

  if (icon === "users") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    );
  }

  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

function defaultItems(role) {
  if (role === ROLES.SUPER_ADMIN) {
    return [{ id: "campaigns", label: "Campanhas", icon: "home", href: "/super-admin" }];
  }

  if (role === ROLES.MANAGER) {
    return [{ id: "leaders", label: "Líderes", icon: "users", href: "/manager" }];
  }

  return [];
}

export function Sidebar({
  items,
  activeItem,
  onItemSelect,
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
  contextLabel,
}) {
  const { user, role, logout } = useAuth();
  const initial = (user?.email ?? "?").charAt(0).toUpperCase();
  const navigationItems = items ?? defaultItems(role);

  return (
    <aside className={`app-sidebar${mobileOpen ? " mobile-open" : ""}`} aria-label="Navegação principal">
      <div className="sidebar-brand">
        {/* Recolhido só cabe o emblema; expandido entra a logo completa, que
            já traz o nome e a assinatura desenhados na própria arte. */}
        <div className="sidebar-logo">
          <img src={logoMark} alt="" />
        </div>
        <div className="sidebar-brand-text">
          <img className="sidebar-brand-logo" src={logoFull} alt="Bem pro Goiás" />
          <div className="sidebar-context-label">{contextLabel ?? "MANDATO COM PARTICIPAÇÃO PÚBLICA"}</div>
        </div>
        <button type="button" className="sidebar-mobile-close" aria-label="Fechar menu" onClick={onCloseMobile}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <div key={item.id} className={item.dividerBefore ? "sidebar-nav-group" : undefined}>
            {item.href ? (
              <NavLink
                to={item.href}
                end={item.end ?? true}
                className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
                title={collapsed ? item.label : undefined}
                onClick={onCloseMobile}
              >
                <NavIcon icon={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ) : (
              <button
                type="button"
                className={`sidebar-nav-item${activeItem === item.id ? " active" : ""}`}
                aria-current={activeItem === item.id ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                onClick={() => onItemSelect?.(item.id)}
              >
                <NavIcon icon={item.icon} />
                <span>{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </nav>

      <button
        type="button"
        className="sidebar-collapse-button"
        aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
        aria-expanded={!collapsed}
        onClick={onToggleCollapsed}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d={collapsed ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
        </svg>
        <span>{collapsed ? "Expandir" : "Recolher menu"}</span>
      </button>

      <div className="sidebar-footer">
        <div className="sidebar-user-avatar">{initial}</div>
        <div className="sidebar-footer-info">
          <div className="sidebar-user-email">{user?.email}</div>
          <div className="sidebar-user-role">{ROLE_LABELS[role] ?? role}</div>
        </div>
        <button type="button" onClick={logout} className="sidebar-logout" title="Sair" aria-label="Sair">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
