import { useState } from "react";
import { GOIANIA_LOCATIONS } from "../../data/goianiaLocations";
import { createLeader } from "../../services/userProvisioning";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  whatsapp: "",
  locationId: "",
  raioKm: "5",
};

export default function LeaderForm({ campaignId, onCreated, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const location = GOIANIA_LOCATIONS.find((item) => item.id === form.locationId);
    if (!location) {
      setError("Selecione um ponto de atuação para posicionar o líder no mapa.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await createLeader({
        name: form.name,
        email: form.email,
        password: form.password,
        whatsapp: form.whatsapp,
        campaignId,
        regiao: location.regiao,
        bairro: location.bairro,
        lat: location.lat,
        lng: location.lng,
        raioKm: Number(form.raioKm) || 5,
      });
      setForm(emptyForm);
      onCreated?.();
    } catch (err) {
      setError(err.code === "auth/email-already-in-use"
        ? "Já existe um usuário com esse e-mail."
        : "Não foi possível criar o líder.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="leader-name">Nome completo</label>
        <input
          id="leader-name"
          type="text"
          placeholder="Nome completo"
          value={form.name}
          onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
          required
        />
      </div>
      <div>
        <label htmlFor="leader-email">E-mail (login)</label>
        <input
          id="leader-email"
          type="email"
          placeholder="E-mail (login)"
          value={form.email}
          onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
          required
        />
      </div>
      <div>
        <label htmlFor="leader-password">Senha inicial</label>
        <input
          id="leader-password"
          type="password"
          placeholder="Senha inicial"
          value={form.password}
          onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
          minLength={6}
          required
        />
      </div>
      <div>
        <label htmlFor="leader-whatsapp">WhatsApp</label>
        <input
          id="leader-whatsapp"
          type="tel"
          placeholder="(62) 9 0000-0000"
          value={form.whatsapp}
          onChange={(e) => setForm((current) => ({ ...current, whatsapp: e.target.value }))}
        />
      </div>
      <div className="leader-location-grid">
        <div>
          <label htmlFor="leader-location">Ponto de atuação no mapa</label>
          <select
            id="leader-location"
            value={form.locationId}
            onChange={(e) => setForm((current) => ({ ...current, locationId: e.target.value }))}
            required
          >
            <option value="">Selecione bairro / região</option>
            {GOIANIA_LOCATIONS.map((location) => (
              <option key={location.id} value={location.id}>
                {location.bairro} · {location.regiao}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="leader-raio">Raio (km)</label>
          <input
            id="leader-raio"
            type="number"
            value={form.raioKm}
            onChange={(e) => setForm((current) => ({ ...current, raioKm: e.target.value }))}
            min="0.5"
            step="0.5"
            required
          />
        </div>
      </div>
      <p className="form-hint">O ponto selecionado posiciona o líder e seu raio de influência no mapa.</p>
      {error && <p role="alert" className="alert-box">{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="submit" disabled={saving}>
          {saving ? "Criando..." : "Criar líder"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
