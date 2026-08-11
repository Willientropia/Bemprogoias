import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../../components/AppLayout";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToCampaign } from "../../services/campaigns";
import { subscribeToLeaders } from "../../services/leaders";
import { DemoBanner } from "./panel/PanelBits";
import { toPanelLeaders } from "./panel/panelLeaders";
import RegionsTab from "./panel/RegionsTab";
import NetworkTab from "./panel/NetworkTab";
import ReportTab from "./panel/ReportTab";
import VotersTab from "./panel/VotersTab";
import LeaderForm from "./LeaderForm";
import LeaderListItem from "./LeaderListItem";

const MANAGER_NAV_ITEMS = [
  { id: "regioes", label: "Regiões", icon: "map" },
  { id: "rede", label: "Rede de Indicações", icon: "network" },
  { id: "eleitores", label: "Eleitores", icon: "voters" },
  { id: "expresso", label: "Relatório Expresso", icon: "report" },
  { id: "cadastro", label: "Cadastro de Líderes", icon: "users", dividerBefore: true },
];

function PanelDataState({ loading, error, leadersCount }) {
  if (loading) {
    return <div className="panel-card panel-state">Carregando líderes da campanha…</div>;
  }

  if (error) {
    return <div className="panel-card panel-state error">Não foi possível carregar os líderes do banco.</div>;
  }

  if (leadersCount === 0) {
    return (
      <div className="panel-card panel-state">
        Esta campanha ainda não possui líderes com localização e métricas para exibir no painel.
      </div>
    );
  }

  return null;
}

export default function ManagerDashboard() {
  const { campaignId } = useAuth();
  const [tab, setTab] = useState("regioes");
  const [campaign, setCampaign] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null);
      return undefined;
    }
    return subscribeToCampaign(campaignId, setCampaign, () => setLoadError(true));
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) {
      setLeaders([]);
      setLoadingLeaders(false);
      return undefined;
    }

    setLoadingLeaders(true);
    setLoadError(false);
    return subscribeToLeaders(
      campaignId,
      (nextLeaders) => {
        setLeaders(nextLeaders);
        setLoadingLeaders(false);
      },
      () => {
        setLoadError(true);
        setLoadingLeaders(false);
      }
    );
  }, [campaignId]);

  const panelLeaders = useMemo(() => toPanelLeaders(leaders), [leaders]);
  const hasPanelData = !loadingLeaders && !loadError && panelLeaders.length > 0;

  return (
    <AppLayout
      sidebarItems={MANAGER_NAV_ITEMS}
      activeSidebarItem={tab}
      onSidebarItemChange={setTab}
      sidebarContextLabel="PAINEL DO GESTOR"
    >
      {campaign?.isDemo && tab !== "cadastro" && <DemoBanner />}

      <section hidden={tab !== "regioes"}>
        <PanelDataState loading={loadingLeaders} error={loadError} leadersCount={panelLeaders.length} />
        {hasPanelData && <RegionsTab leaders={panelLeaders} active={tab === "regioes"} />}
      </section>
      <section hidden={tab !== "rede"}>
        <PanelDataState loading={loadingLeaders} error={loadError} leadersCount={panelLeaders.length} />
        {hasPanelData && <NetworkTab leaders={panelLeaders} />}
      </section>
      <section hidden={tab !== "expresso"}>
        <PanelDataState loading={loadingLeaders} error={loadError} leadersCount={panelLeaders.length} />
        {hasPanelData && <ReportTab leaders={panelLeaders} />}
      </section>
      <section hidden={tab !== "eleitores"}>
        {tab === "eleitores" && (
          <>
            <PanelDataState loading={loadingLeaders} error={loadError} leadersCount={panelLeaders.length} />
            {hasPanelData && <VotersTab campaignId={campaignId} leaders={panelLeaders} />}
          </>
        )}
      </section>

      {tab === "cadastro" && (
        <div>
          <h1>Cadastro de Líderes</h1>
          <p style={{ marginTop: 8, fontSize: 15, marginBottom: 24 }}>
            Líderes vinculados à campanha {campaign?.name ? `“${campaign.name}”` : "atual"}.
          </p>

          <div className="section-head">
            <h2>Líderes cadastrados</h2>
            <button type="submit" onClick={() => setFormOpen(true)} disabled={!campaignId}>
              Novo líder
            </button>
          </div>

          {loadingLeaders && <p>Carregando líderes…</p>}
          {!loadingLeaders && leaders.length === 0 && <p>Nenhum líder cadastrado ainda.</p>}
          <ul>
            {leaders.map((leader) => (
              <LeaderListItem key={leader.id} campaignId={campaignId} leader={leader} />
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={formOpen}
        title="Novo líder"
        subtitle="O líder recebe acesso ao app para cadastrar eleitores em campo."
        onClose={() => setFormOpen(false)}
      >
        <LeaderForm
          campaignId={campaignId}
          onCreated={() => setFormOpen(false)}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </AppLayout>
  );
}
