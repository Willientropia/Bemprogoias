import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../../contexts/AuthContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { applyPwaUpdate, disableNativePwaCache, registerPwa } from '../../services/pwa';
import { startLeaderLocationSharing } from '../../services/liveLocation';
import { checkForAppUpdate, installAndroidUpdate } from '../../services/update';
import { listVoters, removeVoter, saveVoter, syncPendingVoters } from '../../services/voters';
import { toDisplayText } from '../../utils/normalizers';
import { BottomNav } from './components/BottomNav';
import { FieldErrorBoundary } from './components/FieldErrorBoundary';
import { Home } from './components/Home';
import { Icon } from './components/Icon';
import { Profile } from './components/Profile';
import { Toast } from './components/Toast';
import { VoterDetail } from './components/VoterDetail';
import { VoterForm } from './components/VoterForm';
import { VoterList } from './components/VoterList';
import 'leaflet/dist/leaflet.css';
import './leader.css';

const EMPTY_LIVE = { active: false, starting: false, position: null, lastSent: null, error: '' };

export default function LeaderApp() {
  const { user, profile, campaignId, logout } = useAuth();
  const session = useMemo(() => ({
    uid: user.uid,
    campaignId,
    role: 'leader',
    nome: profile?.name || profile?.nomeCompleto || user.displayName || user.email,
    regiao: profile?.regiao || '',
    bairro: profile?.bairro || '',
    login: user.email,
    demo: false
  }), [user, profile, campaignId]);
  const [route, setRoute] = useState('home');
  const [selected, setSelected] = useState(null);
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const [pwaUpdate, setPwaUpdate] = useState(false);
  const [androidUpdate, setAndroidUpdate] = useState(null);
  const [live, setLive] = useState(EMPTY_LIVE);
  const tracker = useRef(null);
  const routeRef = useRef(route);
  const selectedRef = useRef(selected);
  const syncingRef = useRef(false);
  const online = useOnlineStatus();
  routeRef.current = route;
  selectedRef.current = selected;

  const notify = useCallback((message, type = 'success', persistent = false) => {
    setToast({ message, type, persistent, id: Date.now() });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const loaded = await listVoters(session);
      setVoters(Array.isArray(loaded) ? loaded.filter((item) => item && typeof item === 'object') : []);
    } catch (error) {
      console.error('Não foi possível carregar a lista de eleitores.', error);
      notify('Não foi possível atualizar a lista. Os dados salvos no aparelho foram preservados.', 'error');
    } finally {
      setLoading(false);
    }
  }, [session, notify]);

  const sync = useCallback(async ({ quiet = false } = {}) => {
    if (!online || syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const report = await syncPendingVoters(session);
      await refresh();
      if (report.conflicts.length) notify(`${report.conflicts.length} cadastro(s) com RG ou título duplicado precisam de atenção.`, 'error', true);
      else if (report.errors?.length) notify(report.errors[0].message, 'error', true);
      else if (!quiet) notify(report.synced ? `${report.synced} cadastro(s) sincronizado(s).` : 'Tudo já está sincronizado.');
    } catch (error) {
      console.error('Falha inesperada ao sincronizar eleitores.', error);
      if (!quiet) notify(`A sincronização não foi concluída: ${error?.message || 'erro desconhecido'}`, 'error');
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [online, session, refresh, notify]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      disableNativePwaCache().catch((error) => console.error('Não foi possível limpar o cache web antigo.', error));
      return;
    }
    registerPwa({ onUpdate: () => setPwaUpdate(true), onReady: () => notify('Aplicativo pronto para funcionar offline.') });
  }, [notify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (online) sync({ quiet: true });
  }, [online, sync]);

  useEffect(() => {
    if (!online || Capacitor.getPlatform() !== 'android') return;
    checkForAppUpdate(session.campaignId)
      .then((result) => {
        if (result.available || (result.required && result.apkUrl)) setAndroidUpdate(result);
      })
      .catch(() => {});
  }, [online, session.campaignId]);

  useEffect(() => () => {
    tracker.current?.stop();
  }, []);

  const goBack = useCallback(() => {
    const currentRoute = routeRef.current;
    if (currentRoute === 'form' && selectedRef.current) {
      setRoute('detail');
    } else if (currentRoute === 'detail' || currentRoute === 'form') {
      setSelected(null);
      setRoute('voters');
    } else if (currentRoute === 'voters' || currentRoute === 'profile') {
      setSelected(null);
      setRoute('home');
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let listener;
    let disposed = false;
    import('@capacitor/app').then(({ App }) => App.addListener('backButton', () => {
      if (routeRef.current === 'home') App.minimizeApp();
      else goBack();
    })).then((handle) => {
      if (disposed) handle.remove();
      else listener = handle;
    }).catch((error) => console.error('Não foi possível ativar o botão Voltar do Android.', error));
    return () => {
      disposed = true;
      listener?.remove();
    };
  }, [goBack]);

  async function startLive() {
    setLive((current) => ({ ...current, starting: true, error: '' }));
    try {
      tracker.current = await startLeaderLocationSharing(session, {
        onPosition: (position) => setLive((current) => ({ ...current, active: true, starting: false, position, error: '' })),
        onPublished: (position) => setLive((current) => ({ ...current, lastSent: position.deviceTimestamp })),
        onError: (error) => setLive((current) => ({
          ...current,
          active: error.message.toLowerCase().includes('permissão') ? false : current.active,
          starting: false,
          error: error.message
        }))
      });
      setLive((current) => ({ ...current, active: true, starting: false }));
      notify('Localização em tempo real ativada.');
    } catch (error) {
      setLive((current) => ({ ...current, active: false, starting: false, error: error.message }));
    }
  }

  async function stopLive() {
    await tracker.current?.stop();
    tracker.current = null;
    setLive(EMPTY_LIVE);
    notify('Compartilhamento de localização encerrado.', 'info');
  }

  async function handleLogout() {
    if (tracker.current) await stopLive();
    await logout();
  }

  function navigate(next) {
    setSelected(null);
    setRoute(next === 'new' ? 'form' : next);
    window.scrollTo(0, 0);
  }

  function openVoter(voter) {
    setSelected(voter);
    setRoute('detail');
    window.scrollTo(0, 0);
  }

  async function storeVoter(form) {
    const editing = Boolean(selected);
    const saved = await saveVoter(form, session, selected);
    setVoters((current) => [saved, ...(Array.isArray(current) ? current : []).filter((item) => item?.id !== saved.id)]);
    setSelected(null);
    setRoute('voters');
    const syncFailed = saved.syncStatus === 'pending' && Boolean(saved.syncErrorMessage);
    notify(saved.syncStatus === 'pending'
      ? (saved.syncErrorMessage || 'Eleitor salvo no aparelho. Enviaremos quando houver conexão.')
      : editing ? 'Cadastro atualizado.' : 'Eleitor cadastrado com sucesso.', syncFailed ? 'error' : 'success', syncFailed);
    refresh().catch(() => notify('O eleitor foi salvo, mas a lista ainda não foi atualizada.', 'error'));
  }

  async function deleteVoter(voter) {
    if (!window.confirm(`Excluir o cadastro de ${toDisplayText(voter.nome) || 'eleitor sem nome'}?`)) return;
    const removed = await removeVoter(voter);
    await refresh();
    setSelected(null);
    setRoute('voters');
    notify(removed?.syncStatus === 'pending'
      ? (removed.syncErrorMessage || 'Exclusão salva no aparelho e aguardando sincronização.')
      : 'Cadastro excluído.', removed?.syncErrorMessage ? 'error' : 'success', Boolean(removed?.syncErrorMessage));
  }

  async function applyAndroidUpdate() {
    try {
      const result = await installAndroidUpdate(androidUpdate.apkUrl);
      if (result.awaitingPermission) notify('Autorize esta fonte e toque novamente em Atualizar.', 'info', true);
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  if (loading) return <div className="field-root app-loading"><span className="spinner" /><p>Preparando seus dados offline…</p></div>;
  const navRoute = ['home', 'voters', 'profile'].includes(route) ? route : '';
  return (
    <div className="field-root app-shell">
      <div className="app-frame">
        <FieldErrorBoundary resetKey={`${route}:${selected?.id || ''}`} onRecover={() => navigate('voters')}>
          {route === 'home' && <Home session={session} voters={voters} online={online} syncing={syncing} live={live} onStartLive={startLive} onStopLive={stopLive} onNew={() => navigate('new')} onOpen={openVoter} onSeeAll={() => navigate('voters')} onSync={() => sync()} />}
          {route === 'voters' && <VoterList voters={voters} onOpen={openVoter} onNew={() => navigate('new')} />}
          {route === 'form' && <VoterForm voter={selected} online={online} onCancel={goBack} onSave={storeVoter} />}
          {route === 'detail' && selected && <VoterDetail voter={selected} onBack={goBack} onEdit={(voter) => { setSelected(voter); setRoute('form'); }} onDelete={deleteVoter} onMessage={notify} />}
          {route === 'profile' && <Profile session={session} voters={voters} online={online} syncing={syncing} onSync={() => sync()} onLogout={handleLogout} onToast={notify} />}
        </FieldErrorBoundary>
        {navRoute && <BottomNav route={navRoute} onNavigate={navigate} />}
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {pwaUpdate && <div className="pwa-update"><Icon name="sync" /><div><b>Nova versão disponível</b><span>Atualize agora para receber as melhorias.</span></div><button onClick={() => applyPwaUpdate()}>Atualizar</button></div>}
      {androidUpdate && <div className="pwa-update"><Icon name="sync" /><div><b>{androidUpdate.required ? 'Atualização obrigatória' : `Versão ${androidUpdate.latestVersion} disponível`}</b><span>A nova versão será baixada do GitHub.</span></div><button onClick={applyAndroidUpdate}>Atualizar</button></div>}
    </div>
  );
}
