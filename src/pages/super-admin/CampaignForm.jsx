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
      <h2>{editingCampaign ? "Editar campanha" : "Nova campanha"}</h2>
      <input
        type="text"
        placeholder="Nome da campanha"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
      />
      <input
        type="text"
        placeholder="Versão mínima obrigatória (ex: 1.0.0) — opcional"
        value={form.minAppVersion}
        onChange={(e) => setForm((f) => ({ ...f, minAppVersion: e.target.value }))}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={saving}>
        {saving ? "Salvando..." : editingCampaign ? "Salvar alterações" : "Criar campanha"}
      </button>
      {editingCampaign && (
        <button type="button" onClick={() => onDone?.()}>
          Cancelar
        </button>
      )}
    </form>
  );
}
