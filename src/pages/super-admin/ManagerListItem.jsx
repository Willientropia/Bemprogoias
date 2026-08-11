import { useState } from "react";
import { deleteManager, updateManager } from "../../services/managers";

export default function ManagerListItem({ campaignId, manager }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(manager.name ?? "");
  const [whatsapp, setWhatsapp] = useState(manager.whatsapp ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateManager(campaignId, manager.id, { name, whatsapp });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover o gestor "${manager.name}"? O login continua existindo, mas ele perde acesso ao sistema.`)) {
      return;
    }
    await deleteManager(campaignId, manager.id);
  }

  if (editing) {
    return (
      <li>
        <form onSubmit={handleSave}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="WhatsApp"
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
      <strong>{manager.name}</strong>
      <span>{manager.email}</span>
      {manager.whatsapp && <span>{manager.whatsapp}</span>}
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
