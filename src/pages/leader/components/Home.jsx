import { toDisplayText } from '../../../utils/normalizers';
import { Icon } from './Icon';
import { LiveLocationCard } from './LiveLocationCard';
import { VoterCard } from './VoterCard';

function firstName(name) {
  const value = toDisplayText(name).split(/\s+/)[0] || 'Líder';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function Home({ session, voters, online, syncing, live, onStartLive, onStopLive, onNew, onOpen, onSeeAll, onSync }) {
  const safeVoters = Array.isArray(voters)
    ? voters.filter((voter) => voter && typeof voter === 'object')
    : [];
  const pending = safeVoters.filter((voter) => voter.syncStatus === 'pending').length;
  const failed = safeVoters.filter((voter) => voter.syncStatus === 'pending' && voter.syncErrorMessage).length;
  const conflicts = safeVoters.filter((voter) => voter.syncStatus === 'conflict').length;
  const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date());
  return (
    <section className="page home-page">
      <header className="hero-header">
        <div>
          <p className="hero-header__date">{today}</p>
          <h1>Olá, {firstName(session.nome)}.</h1>
          <span className={online ? 'online-label' : 'online-label offline'}>
            <i /> {online ? 'Conectado e protegido' : 'Trabalhando offline'}
          </span>
        </div>
        <div className="mini-mark">GO</div>
      </header>

      <div className="hero-action">
        <span className="hero-action__glow" />
        <div><p>Trabalho de campo</p><h2>Quem você ouviu hoje?</h2><span>Registre um novo contato em menos de 2 minutos.</span></div>
        <button className="button button--light" onClick={onNew}><Icon name="plus" size={20} />Novo eleitor</button>
      </div>

      <div className="stats-grid">
        <article className="stat-card stat-card--primary"><span><Icon name="users" /></span><div><strong>{safeVoters.length}</strong><small>Eleitores cadastrados</small></div></article>
        <article className="stat-card"><span><Icon name={pending ? 'sync' : 'check'} /></span><div><strong>{pending}</strong><small>Aguardando envio</small></div></article>
      </div>

      <LiveLocationCard live={live} online={online} onStart={onStartLive} onStop={onStopLive} />

      {conflicts > 0 && (
        <button className="conflict-callout" onClick={onSeeAll}>
          <Icon name="alert" size={20} /><span><b>{conflicts} {conflicts === 1 ? 'cadastro precisa' : 'cadastros precisam'} de atenção</b><small>Duplicidade encontrada na sincronização</small></span><Icon name="chevron" />
        </button>
      )}

      {pending > 0 && online && (
        <button className="sync-callout" onClick={onSync} disabled={syncing}>
          <span><Icon name="sync" className={syncing ? 'spin' : ''} /></span>
          <div><b>{syncing ? 'Sincronizando…' : failed ? `${failed} ${failed === 1 ? 'envio falhou' : 'envios falharam'}` : `${pending} ${pending === 1 ? 'cadastro pendente' : 'cadastros pendentes'}`}</b><small>{failed ? 'Toque para tentar novamente e ver o motivo' : 'Toque para enviar agora'}</small></div>
          <Icon name="chevron" />
        </button>
      )}

      <div className="section-heading"><div><p>ATIVIDADE</p><h2>Cadastros recentes</h2></div>{safeVoters.length > 3 && <button onClick={onSeeAll}>Ver todos</button>}</div>
      <div className="voter-stack">
        {safeVoters.slice(0, 3).map((voter, index) => <VoterCard key={voter.id || `voter-${index}`} voter={voter} onOpen={onOpen} compact />)}
        {!safeVoters.length && (
          <div className="empty-state empty-state--small"><span><Icon name="users" size={26} /></span><h3>O campo começa aqui</h3><p>Seu primeiro eleitor aparecerá nesta lista.</p><button className="text-button" onClick={onNew}>Fazer primeiro cadastro</button></div>
        )}
      </div>
    </section>
  );
}
