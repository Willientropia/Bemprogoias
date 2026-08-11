import { useEffect, useState } from "react";
import { AppLayout } from "../../components/AppLayout";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToLeaders } from "../../services/leaders";
import { DEMO_LEADERS, isDemoData } from "../../data/demoPanelData";
import { DemoBanner } from "./panel/PanelBits";
import RegionsTab from "./panel/RegionsTab";
import NetworkTab from "./panel/NetworkTab";
import ReportTab from "./panel/ReportTab";
import LeaderForm from "./LeaderForm";
import LeaderListItem from "./LeaderListItem";

const TABS = [
  { id: "regioes", label: "Regiões" },
  { id: "rede", label: "Rede de Indicações" },
  { id: "expresso", label: "Relatório Expresso" },
  { id: "cadastro", label: "Cadastro de Líderes" },
];

export default function ManagerDashboard() {
  const { campaignId } = useAuth();
  const [tab, setTab] = useState("regioes");
  const [leaders, setLeaders] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    return subscribeToLeaders(campaignId, setLeaders);
  }, [campaignId]);

  // As três primeiras abas seguem o handoff de design e rodam sobre a base de
  // demonstração; a aba de cadastro opera nos líderes reais do Firestore.
  const panelLeaders = DEMO_LEADERS;

  return (
    <AppLayout>
      <div className="panel-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`panel-tab${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {isDemoData && tab !== "cadastro" && <DemoBanner />}

      <section hidden={tab !== "regioes"}>
        <RegionsTab leaders={panelLeaders} active={tab === "regioes"} />
      </section>
      <section hidden={tab !== "rede"}>
        <NetworkTab leaders={panelLeaders} />
      </section>
      <section hidden={tab !== "expresso"}>
        <ReportTab leaders={panelLeaders} />
      </section>

      {tab === "cadastro" && (
        <div>
          <h1>Cadastro de Líderes</h1>
          <p style={{ marginTop: 8, fontSize: 15, marginBottom: 24 }}>
            Líderes reais da sua campanha — eles recebem acesso ao app para cadastrar eleitores em campo.
          </p>

          <div className="section-head">
            <h2>Líderes cadastrados</h2>
            <button type="submit" onClick={() => setFormOpen(true)} disabled={!campaignId}>
              Novo líder
            </button>
          </div>

          {leaders.length === 0 && <p>Nenhum líder cadastrado ainda.</p>}
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
