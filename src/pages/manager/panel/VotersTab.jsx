import { useEffect, useMemo, useState } from "react";
import { fetchVoterStats, fetchVotersPage } from "../../../services/voters";
import { formatNumber, validatedVoters } from "./leaderMetrics";
import { Chip, KpiCard, SectionLabel } from "./PanelBits";

const STATUS_OPTIONS = [
  { id: "todos", label: "Todos os status" },
  { id: "validado", label: "Validado" },
  { id: "pendente", label: "Pendente" },
  { id: "revisao", label: "Em revisão" },
];

const STATUS_STYLES = {
  validado: { label: "Validado", background: "var(--brand-50)", color: "var(--brand-700)" },
  pendente: { label: "Pendente", background: "var(--gold-bg)", color: "#8a6d12" },
  revisao: { label: "Em revisão", background: "#fdecea", color: "var(--danger)" },
};

function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatDate(value) {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function maskDocument(value) {
  const text = String(value ?? "");
  if (text.length < 5) return text || "—";
  return `${text.slice(0, 3)}••••${text.slice(-2)}`;
}

export default function VotersTab({ campaignId, leaders }) {
  const [stats, setStats] = useState({ total: 0, week: 0, validated: 0, validationRate: 0 });
  const [voters, setVoters] = useState([]);
  const [leaderFilter, setLeaderFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchVoterStats(campaignId)
      .then((nextStats) => active && setStats(nextStats))
      .catch(() => active && setError("Não foi possível carregar os indicadores de eleitores."));
    return () => { active = false; };
  }, [campaignId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setVoters([]);
    setCursor(null);
    setHasMore(false);
    fetchVotersPage({ campaignId, leaderId: leaderFilter, validationStatus: statusFilter })
      .then((page) => {
        if (!active) return;
        setVoters(page.voters);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      })
      .catch(() => active && setError("Não foi possível consultar os eleitores com estes filtros."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [campaignId, leaderFilter, statusFilter]);

  const leaderById = useMemo(
    () => new Map(leaders.map((leader) => [leader.id, leader])),
    [leaders]
  );

  const rankedLeaders = useMemo(
    () => [...leaders].sort((a, b) => validatedVoters(b) - validatedVoters(a)),
    [leaders]
  );
  const maxLeaderValidated = validatedVoters(rankedLeaders[0]) || 1;

  const visibleVoters = useMemo(() => {
    const term = normalize(search.trim());
    if (!term) return voters;
    return voters.filter((voter) => [voter.name, voter.rg, voter.titulo, voter.bairro, voter.whatsapp]
      .some((value) => normalize(value).includes(term)));
  }, [search, voters]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const page = await fetchVotersPage({
        campaignId,
        leaderId: leaderFilter,
        validationStatus: statusFilter,
        cursor,
      });
      setVoters((current) => [...current, ...page.voters]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      setError("Não foi possível carregar mais eleitores.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <div className="panel-page-heading">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
            <h1>Eleitores cadastrados</h1>
            <Chip background="var(--gold-bg)" color="#8a6d12">DADOS FICTÍCIOS</Chip>
          </div>
          <p style={{ marginTop: 8, fontSize: 15 }}>
            Evidências de captação e produção de cada líder da campanha
          </p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginTop: 22 }}>
        <KpiCard value={formatNumber(stats.total)} label="ELEITORES NA BASE" color="var(--brand-700)" />
        <KpiCard value={formatNumber(stats.validated)} label={`VALIDADOS · ${stats.validationRate}%`} color="var(--brand-700)" />
        <KpiCard value={`+${formatNumber(stats.week)}`} label="CADASTRADOS EM 7 DIAS" />
        <KpiCard value={leaders.filter((leader) => leader.eleitores > 0).length} label="LÍDERES COM PRODUÇÃO" />
      </div>

      <div className="panel-card voters-validation-card">
        <div className="voters-validation-heading">
          <div>
            <SectionLabel>COMO UM ELEITOR É VALIDADO</SectionLabel>
            <h3>Três evidências antes de pontuar o líder</h3>
          </div>
          <Chip background="var(--gold-bg)" color="#8a6d12">SIMULADO NESTA DEMO</Chip>
        </div>
        <div className="voters-validation-grid">
          <div><b>1</b><span><strong>Documento único</strong>RG ou título normalizado, sem repetição na campanha.</span></div>
          <div><b>2</b><span><strong>Contato confirmado</strong>Confirmação por link/OTP no WhatsApp ou ligação registrada.</span></div>
          <div><b>3</b><span><strong>Coerência e auditoria</strong>Localização plausível; divergências seguem para revisão manual.</span></div>
        </div>
        <p>Só o status <strong>Validado</strong> entra na produção, no ranking e nas estrelas. Pendente e Em revisão valem zero até a conclusão.</p>
      </div>

      <div className="panel-card voters-production-card">
        <SectionLabel>PRODUÇÃO COMPROVADA POR LÍDER</SectionLabel>
        <div className="voters-production-grid">
          {rankedLeaders.map((leader, index) => (
            <button key={leader.id} type="button" className="voter-leader-summary" onClick={() => setLeaderFilter(leader.id)}>
              <span className="voter-leader-position">{index + 1}</span>
              <span className="voter-leader-copy">
                <b>{leader.nome}</b>
                <span>{leader.bairro} · {formatNumber(validatedVoters(leader))} validados de {formatNumber(leader.eleitores)}</span>
                <i><span style={{ width: `${Math.round((validatedVoters(leader) / maxLeaderValidated) * 100)}%` }} /></i>
              </span>
              <strong>{formatNumber(validatedVoters(leader))}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="voters-toolbar">
        <div>
          <label htmlFor="voters-leader">Líder responsável</label>
          <select id="voters-leader" value={leaderFilter} onChange={(event) => setLeaderFilter(event.target.value)}>
            <option value="todos">Todos os líderes</option>
            {[...leaders].sort((a, b) => a.nome.localeCompare(b.nome)).map((leader) => (
              <option key={leader.id} value={leader.id}>{leader.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="voters-status">Verificação</label>
          <select id="voters-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {STATUS_OPTIONS.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
          </select>
        </div>
        <div className="voters-search-field">
          <label htmlFor="voters-search">Buscar nos resultados carregados</label>
          <input
            id="voters-search"
            type="search"
            placeholder="Nome, RG, título ou bairro"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert-box" role="alert" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="panel-card voters-table-card">
        <div className="voters-table-heading">
          <div>
            <h3>Registros de captação</h3>
            <p>{loading ? "Consultando o Firestore…" : `${visibleVoters.length} registros exibidos`}</p>
          </div>
          <Chip background="var(--brand-50)" color="var(--brand-700)">SYNC FIRESTORE</Chip>
        </div>
        <div className="voters-table-scroll">
          <table className="voters-table">
            <thead>
              <tr>
                <th>Eleitor</th>
                <th>Líder responsável</th>
                <th>Localização</th>
                <th>Cadastro</th>
                <th>Origem</th>
                <th>Verificação</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visibleVoters.length === 0 && (
                <tr><td colSpan="6" className="voters-empty">Nenhum eleitor encontrado.</td></tr>
              )}
              {visibleVoters.map((voter) => {
                const leader = leaderById.get(voter.leaderId);
                const status = STATUS_STYLES[voter.validationStatus] ?? STATUS_STYLES.pendente;
                return (
                  <tr key={voter.id}>
                    <td>
                      <b>{voter.name}</b>
                      <span>RG {maskDocument(voter.rg)} · Título {maskDocument(voter.titulo)}</span>
                    </td>
                    <td><b>{leader?.nome ?? voter.leaderName ?? "—"}</b><span>{voter.whatsapp}</span></td>
                    <td><b>{voter.bairro}</b><span>{voter.regiao}</span></td>
                    <td><b>{formatDate(voter.createdAt)}</b><span>{voter.locationModeLabel}</span></td>
                    <td>{voter.source}</td>
                    <td>
                      <Chip background={status.background} color={status.color}>{status.label}</Chip>
                      <span title={voter.validationReason}>{voter.validationReason ?? "Sem evidência registrada"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="voters-load-more">
            <button type="button" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Carregando…" : "Carregar mais 50"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
