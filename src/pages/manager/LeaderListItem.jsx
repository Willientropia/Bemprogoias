import { useState } from "react";
import { findLocationPreset, GOIANIA_LOCATIONS } from "../../data/goianiaLocations";
import { deleteLeader, updateLeader } from "../../services/leaders";

export default function LeaderListItem({ campaignId, leader }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(leader.name ?? "");
  const [whatsapp, setWhatsapp] = useState(leader.whatsapp ?? "");
  const [locationId, setLocationId] = useState(findLocationPreset(leader)?.id ?? "");
  const [raioKm, setRaioKm] = useState(leader.raioKm ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    const location = GOIANIA_LOCATIONS.find((item) => item.id === locationId);
    if (!location) return;

    setSaving(true);
    try {
      await updateLeader(campaignId, leader.id, {
        name,
        whatsapp,
        regiao: location.regiao,
        bairro: location.bairro,
        lat: location.lat,
        lng: location.lng,
        raioKm: Number(raioKm) || 5,
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
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required aria-label="Nome do líder" />
          <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" />
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} required aria-label="Ponto de atuação no mapa">
            <option value="">Selecione bairro / região</option>
            {GOIANIA_LOCATIONS.map((location) => (
              <option key={location.id} value={location.id}>{location.bairro} · {location.regiao}</option>
            ))}
          </select>
          <input
            type="number"
            value={raioKm}
            onChange={(e) => setRaioKm(e.target.value)}
            placeholder="Raio (km)"
            min="0.5"
            step="0.5"
            required
            aria-label="Raio em quilômetros"
          />
          <button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          <button type="button" onClick={() => setEditing(false)}>Cancelar</button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <strong>{leader.name}</strong>
      <span>{leader.email}</span>
      {leader.whatsapp && <span>{leader.whatsapp}</span>}
      {(leader.bairro || leader.regiao) && <span>{[leader.bairro, leader.regiao].filter(Boolean).join(" · ")}</span>}
      {leader.raioKm && <span>raio {leader.raioKm} km</span>}
      <div className="item-actions" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button type="button" onClick={() => setEditing(true)}>Editar</button>
        <button type="button" onClick={handleDelete}>Remover</button>
      </div>
    </li>
  );
}
