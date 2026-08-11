import { Icon } from './Icon';
import { toDisplayText } from '../../../utils/normalizers';
import { getVoterSyncStatus } from '../../../utils/voterStatus';

export function VoterCard({ voter, onOpen, compact = false }) {
  const safeVoter = voter && typeof voter === 'object' ? voter : {};
  const name = toDisplayText(safeVoter.nome) || toDisplayText(safeVoter.nomeCompleto) || 'Eleitor sem nome';
  const zona = toDisplayText(safeVoter.zona) || '—';
  const secao = toDisplayText(safeVoter.secao) || '—';
  const status = getVoterSyncStatus(safeVoter);
  return (
    <button type="button" className={`voter-card ${compact ? 'voter-card--compact' : ''}`} onClick={() => onOpen(safeVoter)}>
      <span className="voter-avatar">{name.charAt(0).toUpperCase()}</span>
      <span className="voter-card__body">
        <b>{name}</b>
        <small>Zona {zona} · Seção {secao}</small>
        <span className={`sync-badge sync-badge--${status.className}`} title={toDisplayText(safeVoter.syncErrorMessage) || undefined}><Icon name={status.icon} size={12} />{status.text}</span>
      </span>
      <Icon name="chevron" size={19} className="voter-card__chevron" />
    </button>
  );
}
