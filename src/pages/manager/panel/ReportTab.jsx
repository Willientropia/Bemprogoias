import { useEffect, useMemo, useState } from "react";
import { DEFAULT_REPORT_BLOCKS, DEMO_STATIC_STATS } from "../../../data/demoPanelData";
import { updateReportSettings } from "../../../services/campaigns";
import { whatsappNumber, whatsappUrl } from "../../../utils/whatsapp";
import { buildReportMessage } from "./buildReportMessage";
import { Chip, KpiCard, SectionLabel } from "./PanelBits";

export default function ReportTab({ leaders, campaignId, campaign }) {
  const [horario, setHorario] = useState(campaign?.reportDeliveryTime ?? "21:00");
  const [recipientWhatsapp, setRecipientWhatsapp] = useState(campaign?.reportRecipientWhatsapp ?? "");
  const [blocks, setBlocks] = useState(DEFAULT_REPORT_BLOCKS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testOpened, setTestOpened] = useState(false);

  useEffect(() => {
    setHorario(campaign?.reportDeliveryTime ?? "21:00");
    setRecipientWhatsapp(campaign?.reportRecipientWhatsapp ?? "");
  }, [campaign?.reportDeliveryTime, campaign?.reportRecipientWhatsapp]);

  const message = useMemo(
    () => buildReportMessage({ leaders, blocks, horario }),
    [leaders, blocks, horario]
  );
  const recipientReady = whatsappNumber(recipientWhatsapp).length >= 12;

  function toggleBlock(id) {
    setBlocks((current) => current.map((block) => (
      block.id === id ? { ...block, ativo: !block.ativo } : block
    )));
  }

  async function saveSettings(event) {
    event.preventDefault();
    if (!recipientReady) {
      setError("Informe um WhatsApp válido com DDD.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateReportSettings(campaignId, {
        whatsapp: recipientWhatsapp,
        deliveryTime: horario,
      });
      setSaved(true);
    } catch {
      setError("Não foi possível salvar o destinatário do relatório.");
    } finally {
      setSaving(false);
    }
  }

  function openTestReport() {
    const url = whatsappUrl(recipientWhatsapp, message);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    setTestOpened(true);
    window.setTimeout(() => setTestOpened(false), 2400);
  }

  return (
    <div>
      <div className="panel-page-heading">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
            <h1>Relatório Expresso</h1>
            <Chip background="var(--brand-50)" color="var(--brand-700)">
              ROTINA DIÁRIA
            </Chip>
          </div>
          <p style={{ marginTop: 8, fontSize: 15 }}>
            Consolidado diário de todos os líderes enviado somente ao WhatsApp definido pelo gestor
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#25d366", color: "#fff", borderRadius: 12, padding: "11px 16px" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a11 11 0 0 1-5.9-5.1c-.4-.8-.6-1.5-.6-2.1 0-.6.3-1.2.7-1.6.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .5.4l.8 1.8c.1.2 0 .4-.1.5l-.3.4c-.2.2-.3.3-.2.5.5 1 1.4 1.9 2.5 2.4.2.1.4.1.5-.1l.5-.6c.2-.2.3-.2.5-.1l1.7.8c.3.2.4.3.4.5-.1.2-.1.5-.1.6Z" />
          </svg>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>Destino</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>WhatsApp do gestor</div>
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginTop: 22 }}>
        <KpiCard value={DEMO_STATIC_STATS.relatoriosEnviados} label="RELATÓRIOS ENVIADOS" color="var(--brand-700)" />
        <KpiCard value={DEMO_STATIC_STATS.taxaEntrega} label="TAXA DE ENTREGA" />
        <KpiCard value={horario} label="PRÓXIMO ENVIO DIÁRIO" />
        <KpiCard value={recipientReady ? 1 : 0} label="GESTOR DESTINATÁRIO" />
      </div>

      <div className="panel-split" style={{ display: "grid", gridTemplateColumns: "1fr 372px", gap: 18, marginTop: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <form className="panel-card" style={{ padding: "24px 26px" }} onSubmit={saveSettings}>
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>Destino do relatório</h3>
            <p style={{ fontSize: 13, color: "#8a8b80", marginBottom: 16 }}>
              Um único número do gestor recebe o fechamento de todos os líderes todos os dias.
            </p>
            <div className="panel-form-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr .7fr", gap: 16 }}>
              <div>
                <label htmlFor="report-recipient">WhatsApp do gestor</label>
                <input
                  id="report-recipient"
                  type="tel"
                  value={recipientWhatsapp}
                  onChange={(event) => setRecipientWhatsapp(event.target.value)}
                  placeholder="(62) 9 9999-9999"
                  autoComplete="tel"
                  required
                />
              </div>
              <div>
                <label htmlFor="report-time">Horário do disparo</label>
                <input id="report-time" type="time" value={horario} onChange={(event) => setHorario(event.target.value)} required />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar destinatário"}</button>
              {saved && <span style={{ color: "var(--brand-700)", fontSize: 12.5, fontWeight: 600 }}>Configuração salva ✓</span>}
              {error && <span role="alert" style={{ color: "var(--danger)", fontSize: 12.5 }}>{error}</span>}
            </div>
          </form>

          <div className="panel-card" style={{ padding: "24px 26px" }}>
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>Conteúdo diário</h3>
            <p style={{ fontSize: 13, color: "#8a8b80", marginBottom: 6 }}>
              A produção de todos os {leaders.length} líderes é obrigatória. Os blocos abaixo são complementares.
            </p>
            <div>
              {blocks.map((block) => (
                <div key={block.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderBottom: "1px solid #f0efe9" }}>
                  <span style={{ flex: 1, fontSize: 13.5, color: block.ativo ? "#243528" : "var(--ink-soft)" }}>{block.label}</span>
                  <button
                    type="button"
                    className={`switch${block.ativo ? " on" : ""}`}
                    onClick={() => toggleBlock(block.id)}
                    role="switch"
                    aria-checked={block.ativo}
                    aria-label={block.label}
                  >
                    <i />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9 }}>
              <SectionLabel style={{ flex: 1 }}>PRÉVIA PARA O GESTOR</SectionLabel>
              <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>hoje às {horario}</span>
            </div>
            <div style={{ background: "#e6ddd4", padding: "18px 16px 22px", minHeight: 430 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--brand-900)", display: "flex", alignItems: "center", justifyContent: "center", padding: 3, flexShrink: 0 }}>
                  <img src="/logo-mark.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-strong)" }}>Relatório Expresso</div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>todos os líderes · fechamento diário</div>
                </div>
              </div>
              <div style={{ background: "#dcf8c6", borderRadius: "12px 12px 12px 3px", padding: "13px 15px", boxShadow: "0 1px 2px rgba(0,0,0,.12)", fontSize: 13, lineHeight: 1.62, color: "var(--ink)", whiteSpace: "pre-line" }}>
                {message}
              </div>
              <div style={{ textAlign: "right", fontSize: 10.5, color: "#7a8a7d", marginTop: 6 }}>{horario} ✓✓</div>
            </div>
          </div>

          <button
            type="button"
            onClick={openTestReport}
            disabled={!recipientReady}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", background: "#25d366", padding: 15, fontSize: 14.5 }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
            {testOpened ? "WhatsApp do gestor aberto ✓" : "Abrir teste no WhatsApp"}
          </button>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eef4f0", border: "1px solid #d8e6dd", borderRadius: 12, padding: "14px 16px", color: "#3a5a45", fontSize: 12.5, lineHeight: 1.5 }}>
            O teste abre a mensagem pronta no WhatsApp do gestor. O disparo automático diário depende da conexão com a WhatsApp Business API.
          </div>
        </div>
      </div>
    </div>
  );
}
