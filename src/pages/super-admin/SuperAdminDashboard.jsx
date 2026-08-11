import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteCampaign, subscribeToCampaigns } from "../../services/campaigns";
import { AppLayout } from "../../components/AppLayout";
import { Modal } from "../../components/Modal";
import CampaignForm from "./CampaignForm";

export default function SuperAdminDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => subscribeToCampaigns(setCampaigns), []);

  async function handleDelete(campaign) {
    if (!confirm(`Excluir a campanha "${campaign.name}"? Isso não remove gestores/líderes/eleitores associados.`)) {
      return;
    }
    await deleteCampaign(campaign.id);
  }

  function openCreate() {
    setEditingCampaign(null);
    setFormOpen(true);
  }

  function openEdit(campaign) {
    setEditingCampaign(campaign);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCampaign(null);
  }

  return (
    <AppLayout title="Campanhas" subtitle="Crie e administre as campanhas da plataforma.">
      <div className="section-head">
        <h2>Campanhas cadastradas</h2>
        <button type="submit" onClick={openCreate}>
          Nova campanha
        </button>
      </div>

      {campaigns.length === 0 && <p>Nenhuma campanha cadastrada ainda.</p>}
      <ul>
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <strong>{campaign.name}</strong>
            {campaign.minAppVersion && <span>v. mínima: {campaign.minAppVersion}</span>}
            <div className="item-actions" style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <Link to={`/super-admin/campaigns/${campaign.id}`}>Abrir</Link>
              <button type="button" onClick={() => openEdit(campaign)}>
                Editar
              </button>
              <button type="button" onClick={() => handleDelete(campaign)}>
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={formOpen}
        title={editingCampaign ? "Editar campanha" : "Nova campanha"}
        subtitle={editingCampaign ? "Altere os dados da campanha." : "Cadastre uma nova campanha na plataforma."}
        onClose={closeForm}
      >
        <CampaignForm editingCampaign={editingCampaign} onDone={closeForm} />
      </Modal>
    </AppLayout>
  );
}
