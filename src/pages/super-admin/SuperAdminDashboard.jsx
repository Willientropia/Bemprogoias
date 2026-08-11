import { useEffect, useState } from "react";
import { deleteCampaign, subscribeToCampaigns } from "../../services/campaigns";
import { TopBar } from "../../components/TopBar";
import CampaignForm from "./CampaignForm";

export default function SuperAdminDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [editingCampaign, setEditingCampaign] = useState(null);

  useEffect(() => subscribeToCampaigns(setCampaigns), []);

  async function handleDelete(campaign) {
    if (!confirm(`Excluir a campanha "${campaign.name}"? Isso não remove gestores/líderes/eleitores associados.`)) {
      return;
    }
    await deleteCampaign(campaign.id);
  }

  return (
    <div>
      <TopBar />
      <h1>Painel do Super Admin</h1>

      <CampaignForm
        editingCampaign={editingCampaign}
        onDone={() => setEditingCampaign(null)}
      />

      <h2>Campanhas</h2>
      {campaigns.length === 0 && <p>Nenhuma campanha cadastrada ainda.</p>}
      <ul>
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <strong>{campaign.name}</strong>
            {campaign.minAppVersion && <span> — v. mínima: {campaign.minAppVersion}</span>}
            <button type="button" onClick={() => setEditingCampaign(campaign)}>
              Editar
            </button>
            <button type="button" onClick={() => handleDelete(campaign)}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
