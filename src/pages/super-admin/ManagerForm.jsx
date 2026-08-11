import { useState } from "react";
import { createManager } from "../../services/userProvisioning";

const emptyForm = { name: "", email: "", password: "", whatsapp: "" };

export default function ManagerForm({ campaignId, onCreated, onCancel }) {
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
      <div>
        <label htmlFor="manager-name">Nome completo</label>
        <input
          id="manager-name"
          type="text"
          placeholder="Nome completo"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </div>
      <div>
        <label htmlFor="manager-email">E-mail (login)</label>
        <input
          id="manager-email"
          type="email"
          placeholder="E-mail (login)"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
      </div>
      <div>
        <label htmlFor="manager-password">Senha inicial</label>
        <input
          id="manager-password"
          type="password"
          placeholder="Senha inicial"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          minLength={6}
          required
        />
      </div>
      <div>
        <label htmlFor="manager-whatsapp">WhatsApp</label>
        <input
          id="manager-whatsapp"
          type="tel"
          placeholder="(62) 9 0000-0000"
          value={form.whatsapp}
          onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
        />
      </div>
      {error && <p role="alert" className="alert-box">{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="submit" disabled={saving}>
          {saving ? "Criando..." : "Criar gestor"}
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
