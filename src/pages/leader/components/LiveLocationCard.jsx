import { Icon } from './Icon';

export function LiveLocationCard({ live, online, onStart, onStop }) {
  const coordinates = live.position
    ? `${live.position.lat.toFixed(5)}, ${live.position.lng.toFixed(5)}`
    : 'Aguardando o primeiro sinal do GPS';
  return (
    <article className={`live-location ${live.active ? 'live-location--active' : ''}`}>
      <div className="live-location__head">
        <span className="live-location__icon"><Icon name="location" /></span>
        <div>
          <p>LOCALIZAÇÃO EM TEMPO REAL</p>
          <h3>{live.active ? 'Compartilhamento ativo' : 'Visibilidade em campo'}</h3>
        </div>
        {live.active && <i className="live-pulse" />}
      </div>
      <p className="live-location__description">
        {live.active
          ? 'A coordenação pode acompanhar sua posição enquanto este app estiver aberto.'
          : 'Ative somente durante o trabalho de campo. Você pode parar quando quiser.'}
      </p>
      {live.active && (
        <div className="live-location__position">
          <b>{coordinates}</b>
          <small>{online ? (live.lastSent ? 'Posição enviada à campanha' : 'Conectando com a campanha…') : 'Sem internet: posição aguardando sincronização'}</small>
        </div>
      )}
      {live.error && <p className="field-error"><Icon name="alert" size={15} />{live.error}</p>}
      <button
        className={`button button--wide ${live.active ? 'button--stop' : 'button--secondary'}`}
        onClick={live.active ? onStop : onStart}
        disabled={live.starting}
      >
        {live.starting ? <><span className="spinner spinner--dark" /> Solicitando GPS…</> : live.active
          ? <><span className="stop-dot" /> Parar compartilhamento</>
          : <><Icon name="gps" size={18} /> Compartilhar minha localização</>}
      </button>
      <small className="live-location__privacy">Uso consentido · somente sua campanha · atualização aproximada a cada 10 segundos</small>
    </article>
  );
}
