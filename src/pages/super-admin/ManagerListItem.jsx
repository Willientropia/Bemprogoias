import { useState } from "react";
import { updateManager } from "../../services/managers";

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
      <strong>{manager.name}</strong> — {manager.email}
      {manager.whatsapp && <span> — {manager.whatsapp}</span>}
      <button type="button" onClick={() => setEditing(true)}>
        Editar
      </button>
    </li>
  );
}
