import { useState } from "react";
import { createLeader } from "../../services/userProvisioning";

const emptyForm = { name: "", email: "", password: "", whatsapp: "", regiao: "", raioKm: "" };

export default function LeaderForm({ campaignId, onCreated, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createLeader({ ...form, raioKm: Number(form.raioKm) || null, campaignId });
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
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
          onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
        />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 2 }}>
          <label htmlFor="leader-regiao">Região de atuação</label>
          <input
            id="leader-regiao"
            type="text"
            placeholder="Ex: Setor Bueno"
            value={form.regiao}
            onChange={(e) => setForm((f) => ({ ...f, regiao: e.target.value }))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="leader-raio">Raio (km)</label>
          <input
            id="leader-raio"
            type="number"
            placeholder="5"
            value={form.raioKm}
            onChange={(e) => setForm((f) => ({ ...f, raioKm: e.target.value }))}
            min="0"
            step="0.1"
          />
        </div>
      </div>
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
