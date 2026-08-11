import { useState } from 'react';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import { captureCurrentLocation } from '../../../services/location';
import { formatReport, readLastLocationTrace } from '../../../services/locationDiagnostics';
import { reverseGeocode } from '../../../services/geocoding';
import { Icon } from './Icon';
import { MapPicker } from './MapPicker';

const MODES = [
  { id: 'gps', label: 'Usar GPS', icon: 'gps' },
  { id: 'manual', label: 'Endereço', icon: 'edit' },
  { id: 'mapa', label: 'Marcar mapa', icon: 'map' }
];

// Cada etapa técnica da captura vira uma frase que o líder entende. O nome
// cru continua no diagnóstico, para a coordenação.
const STEP_LABELS = {
  'inicio': 'Iniciando a captura…',
  'importa-plugin': 'Carregando o módulo de GPS…',
  'plugin-importado': 'Módulo de GPS carregado…',
  'permissao-atual': 'Verificando a permissão…',
  'pede-permissao': 'Aguardando sua autorização no Android…',
  'permissao-respondida': 'Autorização registrada…',
  'permissao-ok': 'Permissão liberada…',
  'provedor-nativo: chamando': 'Falando com o GPS do celular…',
  'provedor-nativo: respondeu': 'GPS respondeu…',
  'provedor-webview: chamando': 'Consultando o provedor do sistema…',
  'provedor-navegador: chamando': 'Consultando o GPS do navegador…',
  'endereco: consultando mapa': 'Buscando o endereço do ponto…',
  'endereco: refinando pelo CEP': 'Confirmando o CEP…'
};

function stepLabel(name) {
  return STEP_LABELS[name] || 'Obtendo sinal…';
}

const EMPTY_ADDRESS = { status: 'idle', note: '' };

export function LocationField({ value, onChange, error }) {
  const online = useOnlineStatus();
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState('');
  const [gpsError, setGpsError] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const mode = value?.modo || 'gps';
  const hasPosition = Number.isFinite(value?.lat) && Number.isFinite(value?.lng);

  function selectMode(next) {
    onChange({ modo: next, endereco: '', lat: null, lng: null, accuracy: null, capturedAt: '' });
    setGpsError('');
    setAddress(EMPTY_ADDRESS);
  }

  async function fillAddress(base) {
    if (!navigator.onLine) {
      setAddress({ status: 'offline', note: 'Sem internet agora: as coordenadas ficaram salvas e o endereço pode ser digitado.' });
      return;
    }
    setAddress({ status: 'loading', note: 'Buscando o endereço deste ponto…' });
    try {
      const found = await reverseGeocode(base.lat, base.lng, { onStep: (name) => setProgress(stepLabel(name)) });
      onChange({
        ...base,
        endereco: found.endereco,
        cep: found.cep,
        bairro: found.bairro,
        cidade: found.cidade,
        uf: found.uf
      });
      setAddress({ status: 'ok', note: `Endereço preenchido por ${found.fonte}. Corrija se precisar.` });
    } catch {
      setAddress({
        status: 'fail',
        note: 'Não foi possível descobrir o endereço automaticamente. As coordenadas foram salvas — digite o endereço se quiser.'
      });
    } finally {
      setProgress('');
    }
  }

  async function capture() {
    setCapturing(true);
    setGpsError('');
    setDiagnostic('');
    setAddress(EMPTY_ADDRESS);
    setProgress(stepLabel('inicio'));
    let position;
    try {
      position = await captureCurrentLocation({ onStep: (name) => setProgress(stepLabel(name)) });
    } catch (reason) {
      setGpsError(reason.message);
      setDiagnostic(reason.trace || formatReport(readLastLocationTrace()));
      return;
    } finally {
      setCapturing(false);
      setProgress('');
    }
    const captured = { ...value, modo: 'gps', ...position };
    onChange(captured);
    await fillAddress(captured);
  }

  function showLastDiagnostic() {
    setDiagnostic(formatReport(readLastLocationTrace()) || 'Nenhuma captura registrada neste aparelho ainda.');
  }

  async function copyDiagnostic() {
    try {
      await navigator.clipboard?.writeText(diagnostic);
      setAddress((current) => ({ ...current, note: 'Diagnóstico copiado.' }));
    } catch {
      // Sem área de transferência o texto continua visível para leitura.
    }
  }

  return (
    <fieldset className="location-field">
      <legend>Localização <span>*</span></legend>
      <div className="mode-tabs" role="tablist" aria-label="Modo de localização">
        {MODES.map((item) => (
          <button type="button" key={item.id} className={mode === item.id ? 'active' : ''}
            onClick={() => selectMode(item.id)} role="tab" aria-selected={mode === item.id}>
            <Icon name={item.icon} size={17} />{item.label}
          </button>
        ))}
      </div>

      {mode === 'gps' && (
        <div className="location-panel">
          <div className={`gps-visual ${hasPosition ? 'gps-visual--done' : ''}`}>
            <span><Icon name={hasPosition ? 'check' : 'gps'} size={24} /></span>
            <div>
              <b>{hasPosition ? 'Localização capturada' : 'Posição atual do celular'}</b>
              <small>{hasPosition
                ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)} · precisão ${value.accuracy || '?'} m`
                : 'A permissão é solicitada somente durante o uso.'}</small>
            </div>
          </div>
          <button type="button" className="button button--secondary button--wide" onClick={capture} disabled={capturing}>
            {capturing ? <><span className="spinner spinner--dark" /> {progress || 'Obtendo sinal…'}</> : <><Icon name="gps" size={18} /> {hasPosition ? 'Atualizar posição' : 'Capturar minha posição'}</>}
          </button>

          {hasPosition && (
            <>
              <div className="location-panel location-panel--map">
                <MapPicker online={online} value={value} onChange={() => {}} readOnly />
              </div>
              <label className="field-label">
                <span>Endereço do ponto capturado</span>
                <textarea rows="3" placeholder="Preenchido automaticamente pela coordenada"
                  value={value?.endereco || ''}
                  onChange={(event) => onChange({ ...value, endereco: event.target.value })} />
              </label>
            </>
          )}

          {address.note && (
            <p className={`field-hint ${address.status === 'fail' ? 'field-hint--warn' : ''}`}>
              <Icon name={address.status === 'loading' ? 'sync' : address.status === 'ok' ? 'check' : 'info'} size={14} />
              {address.note}
            </p>
          )}
          {gpsError && <p className="field-error"><Icon name="alert" size={15} />{gpsError}</p>}

          <div className="gps-debug">
            <button type="button" className="text-button" onClick={showLastDiagnostic}>Ver diagnóstico da última captura</button>
            {diagnostic && (
              <details className="gps-debug__report" open>
                <summary>Diagnóstico técnico</summary>
                <pre>{diagnostic}</pre>
                <button type="button" className="text-button" onClick={copyDiagnostic}>Copiar diagnóstico</button>
              </details>
            )}
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="location-panel">
          <label className="field-label">
            <span>Endereço completo</span>
            <textarea rows="3" placeholder="Rua, número, bairro, cidade — GO"
              value={value?.endereco || ''} onChange={(event) => onChange({ ...value, modo: 'manual', endereco: event.target.value })} />
          </label>
          <p className="field-hint"><Icon name="info" size={14} />O endereço será geocodificado pela coordenação quando necessário.</p>
        </div>
      )}

      {mode === 'mapa' && (
        <div className="location-panel location-panel--map">
          <p className="map-instruction">Toque no mapa exatamente onde a pessoa foi contatada.</p>
          <MapPicker online={online} value={value} onChange={(position) => onChange({ ...value, modo: 'mapa', ...position })} />
          {hasPosition && <p className="map-coordinates"><Icon name="location" size={15} />{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</p>}
        </div>
      )}
      {error && <p className="field-error"><Icon name="alert" size={15} />{error}</p>}
    </fieldset>
  );
}
