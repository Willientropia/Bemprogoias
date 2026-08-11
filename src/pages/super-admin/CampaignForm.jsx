import { useEffect, useState } from "react";
import { createCampaign, updateCampaign } from "../../services/campaigns";

const emptyForm = { name: "", minAppVersion: "" };

export default function CampaignForm({ editingCampaign, onDone }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(
      editingCampaign
        ? { name: editingCampaign.name ?? "", minAppVersion: editingCampaign.minAppVersion ?? "" }
        : emptyForm
    );
  }, [editingCampaign]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, form);
      } else {
        await createCampaign(form);
      }
      setForm(emptyForm);
      onDone?.();
    } catch {
      setError("Não foi possível salvar a campanha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="campaign-name">Nome da campanha</label>
        <input
          id="campaign-name"
          type="text"
          placeholder="Nome da campanha"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </div>
      <div>
        <label htmlFor="campaign-version">Versão mínima do app (opcional)</label>
        <input
          id="campaign-version"
          type="text"
          placeholder="Ex: 1.0.0"
          value={form.minAppVersion}
          onChange={(e) => setForm((f) => ({ ...f, minAppVersion: e.target.value }))}
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="submit" disabled={saving}>
          {saving ? "Salvando..." : editingCampaign ? "Salvar alterações" : "Criar campanha"}
        </button>
        {onDone && (
          <button type="button" onClick={() => onDone()}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
