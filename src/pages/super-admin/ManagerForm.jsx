import { useState } from "react";
import { createManager } from "../../services/userProvisioning";

const emptyForm = { name: "", email: "", password: "", whatsapp: "" };

export default function ManagerForm({ campaignId, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createManager({ ...form, campaignId });
      setForm(emptyForm);
      onCreated?.();
    } catch (err) {
      setError(err.code === "auth/email-already-in-use"
        ? "Já existe um usuário com esse e-mail."
        : "Não foi possível criar o gestor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Novo gestor</h3>
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
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={saving}>
        {saving ? "Criando..." : "Criar gestor"}
      </button>
    </form>
  );
}
