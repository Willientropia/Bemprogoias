import { rating } from "./leaderMetrics";

export function Stars({ eleitores }) {
  const rt = rating(eleitores);
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const full = rt >= i - 0.25;
        return (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={full ? "#f3c41c" : "none"} stroke={full ? "#f3c41c" : "#cfd3ca"} strokeWidth="1.8" strokeLinejoin="round">
            <path d="m12 3 2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.3 6.2 20.8l1.6-6.6L2.6 9.8l6.8-.5z" />
          </svg>
        );
      })}
      <b style={{ fontSize: 12, color: "#8a6d12", marginLeft: 5 }}>{rt.toFixed(1)}</b>
    </span>
  );
}

export function KpiCard({ value, label, color }) {
  return (
    <div className="panel-card" style={{ padding: 19 }}>
      <div style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 31, lineHeight: 1, color: color ?? "var(--ink-strong)" }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 0.7, color: "var(--ink-soft)", marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

export function SectionLabel({ children, style }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: "var(--ink-soft)", ...style }}>
      {children}
    </span>
  );
}

export function FilterButton({ active, onClick, children }) {
  return (
    <button type="button" className={`filter-btn${active ? " on" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function Avatar({ name, color, size = 42 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--heading)",
        fontWeight: 700,
        fontSize: size * 0.38,
        color: "#fff",
        background: color,
      }}
    >
      {(name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

export function Chip({ background, color, children, style }) {
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 11px", borderRadius: 999, whiteSpace: "nowrap", background, color, ...style }}>
      {children}
    </span>
  );
}

export function DemoBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--gold-bg)",
        border: "1px solid var(--gold-border)",
        borderRadius: 12,
        padding: "12px 16px",
        color: "#8a6d12",
        fontSize: 12.5,
        lineHeight: 1.5,
        marginBottom: 22,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
      </svg>
      Campanha de demonstração. Os líderes e indicadores abaixo são fictícios e
      existem apenas para apresentar o funcionamento do painel.
    </div>
  );
}
