import { useState } from "react";
import { deleteLeader, updateLeader } from "../../services/leaders";

export default function LeaderListItem({ campaignId, leader }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(leader.name ?? "");
  const [whatsapp, setWhatsapp] = useState(leader.whatsapp ?? "");
  const [regiao, setRegiao] = useState(leader.regiao ?? "");
  const [raioKm, setRaioKm] = useState(leader.raioKm ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateLeader(campaignId, leader.id, {
        name,
        whatsapp,
        regiao,
        raioKm: Number(raioKm) || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover o líder "${leader.name}"? O login continua existindo, mas ele perde acesso ao sistema.`)) {
      return;
    }
    await deleteLeader(campaignId, leader.id);
  }

  if (editing) {
    return (
      <li>
        <form onSubmit={handleSave}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="WhatsApp"
          />
          <input
            type="text"
            value={regiao}
            onChange={(e) => setRegiao(e.target.value)}
            placeholder="Região de atuação"
          />
          <input
            type="number"
            value={raioKm}
            onChange={(e) => setRaioKm(e.target.value)}
            placeholder="Raio (km)"
            min="0"
            step="0.1"
          />
          <button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" onClick={() => setEditing(false)}>
            Cancelar
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <strong>{leader.name}</strong>
      <span>{leader.email}</span>
      {leader.whatsapp && <span>{leader.whatsapp}</span>}
      {leader.regiao && <span>{leader.regiao}</span>}
      {leader.raioKm && <span>raio {leader.raioKm} km</span>}
      <div className="item-actions" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button type="button" onClick={() => setEditing(true)}>
          Editar
        </button>
        <button type="button" onClick={handleDelete}>
          Remover
        </button>
      </div>
    </li>
  );
}
