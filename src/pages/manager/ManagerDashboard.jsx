import { useEffect, useState } from "react";
import { AppLayout } from "../../components/AppLayout";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToLeaders } from "../../services/leaders";
import LeaderForm from "./LeaderForm";
import LeaderListItem from "./LeaderListItem";

export default function ManagerDashboard() {
  const { campaignId } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    return subscribeToLeaders(campaignId, setLeaders);
  }, [campaignId]);

  return (
    <AppLayout title="Líderes" subtitle="Cadastre e acompanhe os líderes regionais da sua campanha.">
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

      <h2 style={{ marginTop: 36, marginBottom: 14 }}>Mapa de influência</h2>
      <div
        style={{
          background: "var(--gold-bg)",
          border: "1px solid var(--gold-border)",
          borderRadius: 13,
          padding: "16px 18px",
          fontSize: 13.5,
          color: "#7a6210",
        }}
      >
        Em construção — os líderes serão plotados com seu raio de influência.
      </div>

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
