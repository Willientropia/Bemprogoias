import { formatWhatsApp, toDisplayText } from '../../../utils/normalizers';
import { openWhatsApp } from '../../../services/messaging';
import { getVoterSyncStatus } from '../../../utils/voterStatus';
import { Icon } from './Icon';

function Row({ label, children }) {
  return <div className="detail-row"><span>{label}</span><b>{toDisplayText(children) || 'Não informado'}</b></div>;
}

export function VoterDetail({ voter, onBack, onEdit, onDelete, onMessage }) {
  const safeVoter = voter && typeof voter === 'object' ? voter : {};
  const status = getVoterSyncStatus(safeVoter);
  const location = safeVoter.localizacao && typeof safeVoter.localizacao === 'object' ? safeVoter.localizacao : {};
  const address = toDisplayText(location.endereco);
  const voterName = toDisplayText(safeVoter.nome) || toDisplayText(safeVoter.nomeCompleto) || 'Eleitor sem nome';
  const conflictMessage = toDisplayText(safeVoter.conflictMessage);
  const hasCoordinates = Number.isFinite(location.lat) && Number.isFinite(location.lng);
  async function message() {
    try {
      await openWhatsApp(safeVoter.whatsapp, `Olá, ${voterName.split(' ')[0]}!`);
    } catch (error) {
      onMessage(error.message, 'error');
    }
  }
  return (
    <section className="page detail-page">
      <header className="page-header detail-header">
        <button type="button" className="icon-button icon-button--back" onClick={onBack} aria-label="Voltar"><Icon name="back" /></button>
        <p>Detalhes do eleitor</p>
        <button type="button" className="icon-button" onClick={() => onEdit(safeVoter)} aria-label="Editar"><Icon name="edit" /></button>
      </header>
      <div className="profile-summary">
        <span className="profile-avatar">{voterName.charAt(0).toUpperCase()}</span>
        <h1>{voterName}</h1>
        <span className={`sync-badge sync-badge--${status.className}`}><Icon name={status.icon} size={13} />{status.text}</span>
      </div>
      {safeVoter.syncStatus === 'conflict' && (
        <div className="conflict-detail"><Icon name="alert" /><div><b>Duplicidade encontrada</b><p>{conflictMessage} Edite o documento ou remova este cadastro.</p></div></div>
      )}
      <section className="detail-card">
        <h2>Identificação</h2>
        <Row label="RG">{safeVoter.rg}</Row>
        <Row label="Título de eleitor">{safeVoter.titulo}</Row>
        <Row label="WhatsApp">{formatWhatsApp(toDisplayText(safeVoter.whatsapp))}</Row>
      </section>
      <section className="detail-card">
        <h2>Dados eleitorais</h2>
        <div className="detail-columns"><Row label="Zona">{safeVoter.zona}</Row><Row label="Seção">{safeVoter.secao}</Row></div>
      </section>
      <section className="detail-card">
        <h2>Localização</h2>
        <div className="location-detail"><span><Icon name={location.modo === 'gps' ? 'gps' : location.modo === 'mapa' ? 'map' : 'edit'} /></span><div><small>{location.modo === 'gps' ? 'GPS do dispositivo' : location.modo === 'mapa' ? 'Marcado no mapa' : 'Endereço digitado'}</small><b>{address || (hasCoordinates ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Não informado')}</b></div></div>
      </section>
      <div className="detail-actions">
        <button type="button" className="button button--whatsapp" onClick={message}><Icon name="whatsapp" />Conversar no WhatsApp</button>
        <button type="button" className="button button--secondary" onClick={() => onEdit(safeVoter)}><Icon name="edit" />Editar cadastro</button>
        <button type="button" className="delete-button" onClick={() => onDelete(safeVoter)}><Icon name="trash" size={17} />Excluir eleitor</button>
      </div>
    </section>
  );
}
