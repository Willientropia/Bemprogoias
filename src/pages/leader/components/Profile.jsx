import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { checkForAppUpdate, installAndroidUpdate } from '../../../services/update';
import { runtime } from '../../../config/runtime';
import { toDisplayText } from '../../../utils/normalizers';
import { Icon } from './Icon';

export function Profile({ session, voters, online, syncing, onSync, onLogout, onToast }) {
  const safeVoters = Array.isArray(voters) ? voters.filter((item) => item && typeof item === 'object') : [];
  const leaderName = toDisplayText(session.nome) || 'Líder';
  const leaderLogin = toDisplayText(session.login);
  const [checking, setChecking] = useState(false);
  const [update, setUpdate] = useState(null);
  async function checkUpdate() {
    setChecking(true);
    try {
      const result = await checkForAppUpdate(session.campaignId);
      setUpdate(result);
      if (!result.configured) onToast('Configure VITE_GITHUB_REPO para habilitar a consulta de releases.', 'info');
      else if (!result.available) onToast('Você já está usando a versão mais recente.', 'success');
    } catch (error) {
      onToast(error.message, 'error');
    } finally {
      setChecking(false);
    }
  }
  async function install() {
    try {
      if (Capacitor.getPlatform() === 'android') {
        const result = await installAndroidUpdate(update.apkUrl);
        if (result.awaitingPermission) onToast('Autorize esta fonte e volte ao app para continuar.', 'info');
      } else {
        window.open(update.pageUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      onToast(error.message, 'error');
    }
  }
  return (
    <section className="page profile-page">
      <header className="standard-header"><div><p>CONTA E APLICATIVO</p><h1>Meu perfil</h1></div></header>
      <div className="leader-card"><span>{leaderName.charAt(0).toUpperCase()}</span><div><h2>{leaderName}</h2><p>Líder de campanha</p><small>{leaderLogin}</small></div></div>
      {session.demo && <div className="demo-profile"><Icon name="info" /><div><b>Dados somente neste aparelho</b><p>Adicione as variáveis Firebase do projeto para sincronizar com a campanha.</p></div></div>}
      <section className="settings-card">
        <h3>Sincronização</h3>
        <button className="settings-row" onClick={onSync} disabled={!online || syncing}>
          <span className="settings-icon"><Icon name="sync" className={syncing ? 'spin' : ''} /></span>
          <div><b>{syncing ? 'Sincronizando…' : 'Sincronizar agora'}</b><small>{online ? `${safeVoters.filter((item) => item.syncStatus === 'pending').length} pendentes` : 'Conecte-se à internet para enviar'}</small></div><Icon name="chevron" />
        </button>
      </section>
      <section className="settings-card">
        <h3>Aplicativo</h3>
        <button className="settings-row" onClick={checkUpdate} disabled={!online || checking}>
          <span className="settings-icon"><Icon name="info" /></span><div><b>{checking ? 'Consultando…' : 'Verificar atualização'}</b><small>Versão instalada {runtime.version}</small></div><Icon name="chevron" />
        </button>
        {(update?.available || update?.required) && <div className="update-card"><b>{update.required ? 'Atualização obrigatória' : `Versão ${update.latestVersion} disponível`}</b><p>{toDisplayText(update.notes).slice(0, 180) || `A campanha requer no mínimo a versão ${toDisplayText(update.minAppVersion)}.`}</p>{(update.pageUrl || update.apkUrl) ? <button className="button button--primary button--wide" onClick={install}>Atualizar aplicativo</button> : <p>Peça à coordenação para configurar o repositório de releases.</p>}</div>}
      </section>
      <button className="logout-button" onClick={onLogout}><Icon name="logout" />Sair da conta</button>
      <p className="legal-note">Bem pro Goiás · Os dados deste app devem ser tratados conforme a LGPD e as regras da campanha.</p>
    </section>
  );
}
