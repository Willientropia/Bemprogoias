import { useMemo, useState } from "react";
import { DEFAULT_REPORT_BLOCKS, DEMO_RECIPIENTS, DEMO_STATIC_STATS } from "../../../data/demoPanelData";
import { buildReportMessage } from "./buildReportMessage";
import { Avatar, Chip, FilterButton, KpiCard, SectionLabel } from "./PanelBits";

const FREQUENCIES = ["Diário (fim do dia)", "A cada 12 horas", "A cada 6 horas", "Semanal"];
const SCOPES = [
  "Todos os líderes de Goiânia",
  "Somente Região Central",
  "Somente bases em alerta",
  "Top 20 líderes",
];

export default function ReportTab({ leaders }) {
  const [frequencia, setFrequencia] = useState(FREQUENCIES[0]);
  const [horario, setHorario] = useState("21:00");
  const [escopo, setEscopo] = useState(SCOPES[0]);
  const [blocks, setBlocks] = useState(DEFAULT_REPORT_BLOCKS);
  const [testSent, setTestSent] = useState(false);

  const totalRecipients = DEMO_RECIPIENTS.reduce((acc, r) => acc + r.pessoas, 0);

  const message = useMemo(
    () => buildReportMessage({ leaders, blocks, frequencia, horario }),
    [leaders, blocks, frequencia, horario]
  );

  function toggleBlock(id) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ativo: !b.ativo } : b)));
  }

  function sendTest() {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2400);
  }

  const quando = `${frequencia === "Semanal" ? "toda segunda" : "hoje"} ${horario}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
            <h1>Relatório Expresso</h1>
            <Chip background="var(--brand-50)" color="var(--brand-700)" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--brand-700)" }} />
              BOT ATIVO
            </Chip>
          </div>
          <p style={{ marginTop: 8, fontSize: 15 }}>
            Um bot envia no WhatsApp o consolidado dos líderes ao fim de cada dia — e na frequência
            que você definir
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#25d366", color: "#fff", borderRadius: 12, padding: "11px 16px" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a11 11 0 0 1-5.9-5.1c-.4-.8-.6-1.5-.6-2.1 0-.6.3-1.2.7-1.6.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .5.4l.8 1.8c.1.2 0 .4-.1.5l-.3.4c-.2.2-.3.3-.2.5.5 1 1.4 1.9 2.5 2.4.2.1.4.1.5-.1l.5-.6c.2-.2.3-.2.5-.1l1.7.8c.3.2.4.3.4.5-.1.2-.1.5-.1.6Z" />
          </svg>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>Conectado</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>WhatsApp Business</div>
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginTop: 22 }}>
        <KpiCard value={DEMO_STATIC_STATS.relatoriosEnviados} label="RELATÓRIOS ENVIADOS" color="var(--brand-700)" />
        <KpiCard value={DEMO_STATIC_STATS.taxaEntrega} label="TAXA DE ENTREGA" />
        <KpiCard value={horario} label="PRÓXIMO ENVIO" />
        <KpiCard value={totalRecipients} label="DESTINATÁRIOS" />
      </div>

      <div className="panel-split" style={{ display: "grid", gridTemplateColumns: "1fr 372px", gap: 18, marginTop: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="panel-card" style={{ padding: "24px 26px" }}>
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>Frequência de envio</h3>
            <p style={{ fontSize: 13, color: "#8a8b80", marginBottom: 16 }}>
              Com que intervalo o bot dispara o consolidado dos líderes
            </p>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              {FREQUENCIES.map((f) => (
                <FilterButton key={f} active={frequencia === f} onClick={() => setFrequencia(f)}>
                  {f}
                </FilterButton>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <div>
                <label htmlFor="report-time">Horário do disparo</label>
                <input id="report-time" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
              </div>
              <div>
                <label htmlFor="report-scope">Escopo do relatório</label>
                <select id="report-scope" value={escopo} onChange={(e) => setEscopo(e.target.value)}>
                  {SCOPES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="panel-card" style={{ padding: "24px 26px" }}>
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>O que entra no relatório</h3>
            <p style={{ fontSize: 13, color: "#8a8b80", marginBottom: 6 }}>
              Os blocos ativados aparecem na mensagem do WhatsApp
            </p>
            <div>
              {blocks.map((b) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderBottom: "1px solid #f0efe9" }}>
                  <span style={{ flex: 1, fontSize: 13.5, color: b.ativo ? "#243528" : "var(--ink-soft)" }}>{b.label}</span>
                  <button
                    type="button"
                    className={`switch${b.ativo ? " on" : ""}`}
                    onClick={() => toggleBlock(b.id)}
                    role="switch"
                    aria-checked={b.ativo}
                    aria-label={b.label}
                  >
                    <i />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-card" style={{ padding: "24px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
              <h3 style={{ fontSize: 18 }}>Destinatários</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {DEMO_RECIPIENTS.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#f7f7f3", borderRadius: 11, padding: "12px 14px" }}>
                  <Avatar name={r.nome} color="#25d366" size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#243528" }}>{r.nome}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                      {r.telefone} · {r.papel}
                    </div>
                  </div>
                  <Chip background="var(--brand-50)" color="var(--brand-700)">ativo</Chip>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9 }}>
              <SectionLabel style={{ flex: 1 }}>PRÉVIA DA MENSAGEM</SectionLabel>
              <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{quando}</span>
            </div>
            <div style={{ background: "#e6ddd4", padding: "18px 16px 22px", minHeight: 430 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--brand-900)", display: "flex", alignItems: "center", justifyContent: "center", padding: 3, flexShrink: 0 }}>
                  <img src="/logo-mark.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-strong)" }}>Relatório Expresso</div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>bot oficial · online</div>
                </div>
              </div>
              <div
                style={{
                  background: "#dcf8c6",
                  borderRadius: "12px 12px 12px 3px",
                  padding: "13px 15px",
                  boxShadow: "0 1px 2px rgba(0,0,0,.12)",
                  fontSize: 13,
                  lineHeight: 1.62,
                  color: "var(--ink)",
                  whiteSpace: "pre-line",
                }}
              >
                {message}
              </div>
              <div style={{ textAlign: "right", fontSize: 10.5, color: "#7a8a7d", marginTop: 6 }}>{horario} ✓✓</div>
            </div>
          </div>

          <button
            type="submit"
            onClick={sendTest}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", background: "#25d366", padding: 15, fontSize: 14.5 }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
            {testSent ? `Teste enviado aos ${totalRecipients} destinatários ✓` : "Enviar teste agora"}
          </button>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eef4f0", border: "1px solid #d8e6dd", borderRadius: 12, padding: "14px 16px", color: "#3a5a45", fontSize: 12.5, lineHeight: 1.5 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--brand-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
            </svg>
            Envio por WhatsApp Business API com registro de entrega. Nenhum dado do eleitor sai da
            plataforma — o relatório traz apenas números consolidados.
          </div>
        </div>
      </div>
    </div>
  );
}
