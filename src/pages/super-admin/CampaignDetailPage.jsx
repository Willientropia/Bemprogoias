import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TopBar } from "../../components/TopBar";
import { subscribeToManagers } from "../../services/managers";
import ManagerForm from "./ManagerForm";
import ManagerListItem from "./ManagerListItem";

export default function CampaignDetailPage() {
  const { campaignId } = useParams();
  const [managers, setManagers] = useState([]);

  useEffect(() => subscribeToManagers(campaignId, setManagers), [campaignId]);

  return (
    <div>
      <TopBar />
      <Link to="/super-admin">← Campanhas</Link>
      <h1>Gestores da campanha</h1>

      <ManagerForm campaignId={campaignId} onCreated={() => {}} />

      <h2>Gestores cadastrados</h2>
      {managers.length === 0 && <p>Nenhum gestor cadastrado ainda.</p>}
      <ul>
        {managers.map((manager) => (
          <ManagerListItem key={manager.id} campaignId={campaignId} manager={manager} />
        ))}
      </ul>
    </div>
  );
}
