import { useMemo, useState } from "react";
import { PERF_COLORS } from "../../../data/demoPanelData";
import { formatNumber, rating, ratingRange, sortLeaders, validatedVoters, weeklyColor } from "./leaderMetrics";
import { Avatar, FilterButton, KpiCard, SectionLabel, Stars } from "./PanelBits";

const SORTS = [
  { id: "eleitores", label: "Mais validados" },
  { id: "rating", label: "Melhor rating" },
  { id: "crescimento", label: "Maior crescimento" },
];

const MEDALS = ["#f3c41c", "#c8cbd0", "#cd9b62"];
const PLACES = ["1º", "2º", "3º"];

export default function NetworkTab({ leaders }) {
  const [sortMode, setSortMode] = useState("eleitores");

  const sorted = useMemo(() => sortLeaders(leaders, sortMode), [leaders, sortMode]);
  const podium = sorted.slice(0, 3);

  const totalValidated = leaders.reduce((acc, leader) => acc + validatedVoters(leader), 0);
  const novos = leaders.reduce((acc, l) => acc + l.semana, 0);
  const { minimum, maximum } = ratingRange(leaders);
  const score = (leader) => rating(validatedVoters(leader), minimum, maximum);
  const avgRating = leaders.reduce((acc, leader) => acc + score(leader), 0) / leaders.length;
  const max = Math.max(...leaders.map(validatedVoters), 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <h1>Rede de Indicações</h1>
          <p style={{ marginTop: 8, fontSize: 15 }}>
            Desempenho dos líderes pelos eleitores validados — atualizado diariamente
          </p>
        </div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {SORTS.map((s) => (
            <FilterButton key={s.id} active={sortMode === s.id} onClick={() => setSortMode(s.id)}>
              {s.label}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="kpi-grid" style={{ marginTop: 22 }}>
        <KpiCard value={formatNumber(totalValidated)} label="ELEITORES VALIDADOS" color="var(--brand-700)" />
        <KpiCard value={formatNumber(Math.round(totalValidated / leaders.length))} label="MÉDIA VALIDADA POR LÍDER" />
        <KpiCard value={avgRating.toFixed(1)} label="RATING MÉDIO DA REDE" color="#b8860b" />
        <KpiCard value={`+${formatNumber(novos)}`} label="NOVOS ESTA SEMANA" color="var(--brand-700)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 20 }} className="panel-podium">
        {podium.map((leader, i) => {
          const first = i === 0;
          return (
            <div
              key={leader.id}
              className="panel-card"
              style={{
                padding: 22,
                position: "relative",
                overflow: "hidden",
                background: first ? "var(--brand-900)" : undefined,
                borderColor: first ? "var(--brand-900)" : undefined,
                color: first ? "#fff" : undefined,
              }}
            >
              {first && (
                <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(243,196,28,.16),transparent 70%)", top: -110, right: -60 }} />
              )}
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: MEDALS[i],
                    color: "var(--brand-900)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--heading)",
                    fontWeight: 700,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {PLACES[i]}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 17, lineHeight: 1.1, color: first ? "#fff" : "var(--ink-strong)" }}>
                    {leader.nome}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2, color: first ? "rgba(255,255,255,.6)" : "#8a8b80" }}>
                    {leader.bairro}
                  </div>
                </div>
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "baseline", gap: 7 }}>
                <b style={{ fontFamily: "var(--heading)", fontSize: 32, color: first ? "var(--gold)" : "var(--brand-700)" }}>
                  {formatNumber(validatedVoters(leader))}
                </b>
                <span style={{ fontSize: 12.5, color: first ? "rgba(255,255,255,.7)" : "var(--ink-muted)" }}>
                  validados de {formatNumber(leader.eleitores)} · +{leader.semana} na semana
                </span>
              </div>
              <div style={{ position: "relative", marginTop: 11 }}>
                <Stars value={score(leader)} />
              </div>
            </div>
          );
        })}
      </div>

      <SectionLabel style={{ display: "block", margin: "28px 0 13px" }}>
        CLASSIFICAÇÃO COMPLETA DOS LÍDERES
      </SectionLabel>

      <div className="panel-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "52px 1fr 132px 108px 92px",
                gap: 14,
                padding: "12px 20px",
                background: "#f7f7f3",
                borderBottom: "1px solid var(--border)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.8,
                color: "var(--ink-soft)",
              }}
            >
              <span>#</span>
              <span>LÍDER</span>
              <span>RATING</span>
              <span style={{ textAlign: "right" }}>VALIDADOS</span>
              <span style={{ textAlign: "right" }}>SEMANA</span>
            </div>

            {sorted.map((leader, i) => (
              <div
                key={leader.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "52px 1fr 132px 108px 92px",
                  gap: 14,
                  alignItems: "center",
                  padding: "13px 20px",
                  borderBottom: "1px solid #f0efe9",
                }}
              >
                <span style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 16, color: i < 3 ? "#b8860b" : "#c2c8bf" }}>
                  {i + 1}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                  <Avatar name={leader.nome} color={PERF_COLORS[leader.perf]} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#243528" }}>{leader.nome}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                      {leader.bairro} · {leader.regiao}
                    </div>
                  </div>
                </div>
                <div>
                  <Stars value={score(leader)} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <b style={{ fontSize: 14, color: "#243528" }}>{formatNumber(validatedVoters(leader))}</b>
                  <span style={{ display: "block", fontSize: 10, color: "var(--ink-soft)" }}>de {formatNumber(leader.eleitores)}</span>
                  <div style={{ height: 5, background: "#eef0ec", borderRadius: 999, overflow: "hidden", marginTop: 5 }}>
                    <div
                      style={{
                        width: `${Math.round((validatedVoters(leader) / max) * 100)}%`,
                        height: "100%",
                        background: PERF_COLORS[leader.perf],
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
                <span style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: weeklyColor(leader.semana) }}>
                  +{leader.semana}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
