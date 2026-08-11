import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../../components/AppLayout";
import { Modal } from "../../components/Modal";
import { subscribeToManagers } from "../../services/managers";
import { subscribeToLeaders } from "../../services/leaders";
import ManagerForm from "./ManagerForm";
import ManagerListItem from "./ManagerListItem";
import LeaderListItem from "../manager/LeaderListItem";

export default function CampaignDetailPage() {
  const { campaignId } = useParams();
  const [managers, setManagers] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => subscribeToManagers(campaignId, setManagers), [campaignId]);
  useEffect(() => subscribeToLeaders(campaignId, setLeaders), [campaignId]);

  return (
    <AppLayout title="Campanha" subtitle="Gestores e líderes com acesso a esta campanha.">
      <Link to="/super-admin" style={{ fontSize: 13.5, display: "inline-block", marginBottom: 22 }}>
        ← Voltar para campanhas
      </Link>

      <div className="section-head">
        <h2>Gestores</h2>
        <button type="submit" onClick={() => setFormOpen(true)}>
          Novo gestor
        </button>
      </div>
      {managers.length === 0 && <p>Nenhum gestor cadastrado ainda.</p>}
      <ul>
        {managers.map((manager) => (
          <ManagerListItem key={manager.id} campaignId={campaignId} manager={manager} />
        ))}
      </ul>

      <div className="section-head" style={{ marginTop: 36 }}>
        <h2>Líderes</h2>
      </div>
      {leaders.length === 0 && <p>Nenhum líder cadastrado ainda. Os líderes são criados pelos gestores.</p>}
      <ul>
        {leaders.map((leader) => (
          <LeaderListItem key={leader.id} campaignId={campaignId} leader={leader} />
        ))}
      </ul>

      <Modal
        open={formOpen}
        title="Novo gestor"
        subtitle="O gestor recebe acesso para administrar os líderes desta campanha."
        onClose={() => setFormOpen(false)}
      >
        <ManagerForm campaignId={campaignId} onCreated={() => setFormOpen(false)} onCancel={() => setFormOpen(false)} />
      </Modal>
    </AppLayout>
  );
}
