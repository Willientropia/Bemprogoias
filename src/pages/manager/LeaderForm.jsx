import { useState } from "react";
import { createLeader } from "../../services/userProvisioning";

const emptyForm = { name: "", email: "", password: "", whatsapp: "", regiao: "", raioKm: "" };

export default function LeaderForm({ campaignId, onCreated }) {
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
      <h3>Novo líder</h3>
      <input
        type="text"
        placeholder="Nome completo"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
      />
      <input
        type="email"
        placeholder="E-mail (login)"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        required
      />
      <input
        type="password"
        placeholder="Senha inicial"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        minLength={6}
        required
      />
      <input
        type="tel"
        placeholder="WhatsApp"
        value={form.whatsapp}
        onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
      />
      <input
        type="text"
        placeholder="Região de atuação"
        value={form.regiao}
        onChange={(e) => setForm((f) => ({ ...f, regiao: e.target.value }))}
      />
      <input
        type="number"
        placeholder="Raio de influência (km)"
        value={form.raioKm}
        onChange={(e) => setForm((f) => ({ ...f, raioKm: e.target.value }))}
        min="0"
        step="0.1"
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={saving}>
        {saving ? "Criando..." : "Criar líder"}
      </button>
    </form>
  );
}
