import { useEffect, useState } from 'react';
import { formatRg, formatWhatsApp, onlyDigits, toDisplayText, validateVoter } from '../../../utils/normalizers';
import { Icon } from './Icon';
import { LocationField } from './LocationField';

function emptyVoter() {
  return {
    nome: '',
    rg: '',
    titulo: '',
    zona: '',
    secao: '',
    whatsapp: '',
    localizacao: { modo: 'gps', endereco: '', lat: null, lng: null, accuracy: null, capturedAt: '' }
  };
}

function editableVoter(voter) {
  const empty = emptyVoter();
  if (!voter || typeof voter !== 'object') return empty;
  const location = voter.localizacao && typeof voter.localizacao === 'object' ? voter.localizacao : {};
  return {
    ...empty,
    ...voter,
    nome: toDisplayText(voter.nome) || toDisplayText(voter.nomeCompleto),
    rg: toDisplayText(voter.rg),
    titulo: toDisplayText(voter.titulo),
    zona: toDisplayText(voter.zona),
    secao: toDisplayText(voter.secao),
    whatsapp: toDisplayText(voter.whatsapp) || toDisplayText(voter.telefone),
    localizacao: { ...empty.localizacao, ...location, endereco: toDisplayText(location.endereco) }
  };
}

function Field({ label, optional, error, children }) {
  return (
    <label className={`field-label ${error ? 'field-label--error' : ''}`}>
      <span>{label} {optional ? <small>opcional</small> : <em>*</em>}</span>
      {children}
      {error && <small className="field-error"><Icon name="alert" size={14} />{error}</small>}
    </label>
  );
}

export function VoterForm({ voter, onCancel, onSave, online }) {
  const [form, setForm] = useState(() => editableVoter(voter));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // O corpo precisa ser um bloco: o valor devolvido por um efeito vira a função
  // de limpeza do React, e alguns WebView do Android não devolvem undefined em
  // window.scrollTo — o app quebrava ao sair do formulário.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function submit(event) {
    event.preventDefault();
    const validation = validateVoter(form);
    setErrors(validation);
    setSaveError('');
    if (Object.keys(validation).length) {
      document.querySelector('.field-label--error, .field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (reason) {
      setSaveError(reason.message || 'Não foi possível salvar o eleitor.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page form-page">
      <header className="page-header page-header--sticky">
        <button className="icon-button icon-button--back" type="button" onClick={onCancel} aria-label="Voltar"><Icon name="back" /></button>
        <div><p>{voter ? 'Atualizar cadastro' : 'Novo cadastro'}</p><h1>{voter ? (form.nome || 'Eleitor sem nome') : 'Cadastrar eleitor'}</h1></div>
        <span className={`connection-dot ${online ? 'is-online' : ''}`} title={online ? 'Online' : 'Offline'} />
      </header>
      {!online && (
        <div className="offline-banner"><Icon name="cloudOff" size={19} /><span><b>Você está offline.</b> Preencha normalmente; o cadastro será enviado ao reconectar.</span></div>
      )}
      <form className="voter-form" onSubmit={submit} noValidate>
        <section className="form-section">
          <div className="section-title"><span>01</span><div><h2>Dados pessoais</h2><p>Identificação principal do eleitor</p></div></div>
          <Field label="Nome completo" error={errors.nome}>
            <input value={form.nome} onChange={(event) => change('nome', event.target.value)} placeholder="Como a pessoa se chama?" autoComplete="name" />
          </Field>
          <div className="field-grid">
            <Field label="RG" error={errors.rg}>
              <input inputMode="numeric" value={form.rg} onChange={(event) => change('rg', formatRg(event.target.value))} placeholder="00.000.000-0" />
            </Field>
            <Field label="Título de eleitor" optional error={errors.titulo}>
              <input inputMode="numeric" value={form.titulo} onChange={(event) => change('titulo', onlyDigits(event.target.value).slice(0, 12))} placeholder="12 dígitos" />
            </Field>
          </div>
          <Field label="WhatsApp" error={errors.whatsapp}>
            <input inputMode="tel" autoComplete="tel" value={form.whatsapp}
              onChange={(event) => change('whatsapp', formatWhatsApp(event.target.value))} placeholder="(62) 99999-0000" />
          </Field>
        </section>

        <section className="form-section">
          <div className="section-title"><span>02</span><div><h2>Dados eleitorais</h2><p>Informações do local de votação</p></div></div>
          <div className="field-grid">
            <Field label="Zona" error={errors.zona}>
              <input inputMode="numeric" value={form.zona} onChange={(event) => change('zona', onlyDigits(event.target.value).slice(0, 4))} placeholder="Ex.: 133" />
            </Field>
            <Field label="Seção" error={errors.secao}>
              <input inputMode="numeric" value={form.secao} onChange={(event) => change('secao', onlyDigits(event.target.value).slice(0, 4))} placeholder="Ex.: 0245" />
            </Field>
          </div>
        </section>

        <section className="form-section">
          <div className="section-title"><span>03</span><div><h2>Localização do contato</h2><p>Escolha uma das três opções</p></div></div>
          <LocationField value={form.localizacao} onChange={(value) => change('localizacao', value)} error={errors.localizacao} />
        </section>

        {saveError && <div className="form-message form-message--error form-message--large"><Icon name="alert" />{saveError}</div>}
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <><Icon name="check" size={18} />Salvar eleitor</>}
          </button>
        </div>
        {!online && <p className="submit-hint"><Icon name="sync" size={15} />A duplicidade em toda a campanha será confirmada na sincronização.</p>}
      </form>
    </section>
  );
}
