import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationField } from '../../src/pages/leader/components/LocationField';
import { captureCurrentLocation } from '../../src/services/location';
import { reverseGeocode } from '../../src/services/geocoding';

vi.mock('../../src/hooks/useOnlineStatus', () => ({ useOnlineStatus: vi.fn(() => true) }));
vi.mock('../../src/services/location', () => ({ captureCurrentLocation: vi.fn() }));
vi.mock('../../src/services/geocoding', () => ({ reverseGeocode: vi.fn() }));
vi.mock('../../src/pages/leader/components/MapPicker', () => ({
  MapPicker: ({ readOnly }) => <div data-testid="mapa">{readOnly ? 'somente leitura' : 'editável'}</div>
}));

const emptyGps = { modo: 'gps', endereco: '', lat: null, lng: null };
const captured = { lat: -16.6799, lng: -49.2553, accuracy: 12, capturedAt: '2026-08-11T21:00:00.000Z' };

beforeEach(() => {
  captureCurrentLocation.mockReset();
  reverseGeocode.mockReset();
  localStorage.clear();
});

describe('LocationField', () => {
  it('encerra o estado de carregamento e libera nova tentativa quando o GPS falha', async () => {
    captureCurrentLocation.mockRejectedValueOnce(new Error('O GPS demorou para responder.'));
    const user = userEvent.setup();
    render(<LocationField value={emptyGps} onChange={vi.fn()} error="" />);

    await user.click(screen.getByRole('button', { name: /Capturar minha posição/i }));
    expect(await screen.findByText(/GPS demorou/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Capturar minha posição/i })).toBeEnabled());
  });

  it('mostra o diagnóstico da etapa que falhou', async () => {
    const failure = new Error('Nenhum provedor respondeu em 12 segundos.');
    failure.trace = 'plataforma: android\n     0ms  inicio\n  8123ms  provedor-nativo: falhou — LOCATION_TIMEOUT';
    captureCurrentLocation.mockRejectedValueOnce(failure);
    const user = userEvent.setup();
    render(<LocationField value={emptyGps} onChange={vi.fn()} error="" />);

    await user.click(screen.getByRole('button', { name: /Capturar minha posição/i }));

    expect(await screen.findByText(/provedor-nativo: falhou/)).toBeInTheDocument();
    expect(screen.getByText('Diagnóstico técnico')).toBeInTheDocument();
  });

  it('mostra cada etapa da captura enquanto o GPS responde', async () => {
    let emit;
    let finishCapture;
    captureCurrentLocation.mockImplementationOnce(({ onStep }) => new Promise((resolve) => {
      emit = onStep;
      finishCapture = () => resolve(captured);
    }));
    reverseGeocode.mockResolvedValueOnce({ endereco: 'Rua 4 — Goiânia - GO', fonte: 'OpenStreetMap', cep: '' });
    const user = userEvent.setup();
    render(<LocationField value={emptyGps} onChange={vi.fn()} error="" />);

    await user.click(screen.getByRole('button', { name: /Capturar minha posição/i }));
    act(() => emit('pede-permissao'));
    expect(await screen.findByText(/Aguardando sua autorização/i)).toBeInTheDocument();

    // A captura precisa terminar dentro do teste: uma promessa pendente
    // vazaria para o caso seguinte e consumiria o mock dele.
    await act(async () => finishCapture());
    expect(await screen.findByText(/Endereço preenchido por OpenStreetMap/i)).toBeInTheDocument();
  });

  it('preenche o endereço e mostra o mapa após capturar a posição', async () => {
    captureCurrentLocation.mockResolvedValueOnce(captured);
    reverseGeocode.mockResolvedValueOnce({
      endereco: 'Rua 4, 120 — Setor Central — Goiânia - GO · CEP 74020050',
      cep: '74020050', bairro: 'Setor Central', cidade: 'Goiânia', uf: 'GO', fonte: 'OpenStreetMap + ViaCEP'
    });
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<LocationField value={emptyGps} onChange={onChange} error="" />);

    await user.click(screen.getByRole('button', { name: /Capturar minha posição/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    expect(onChange.mock.calls[0][0]).toMatchObject({ modo: 'gps', lat: -16.6799, lng: -49.2553 });
    expect(onChange.mock.calls[1][0]).toMatchObject({
      endereco: 'Rua 4, 120 — Setor Central — Goiânia - GO · CEP 74020050',
      cep: '74020050'
    });
    expect(reverseGeocode).toHaveBeenCalledWith(-16.6799, -49.2553, expect.anything());
  });

  it('mantém a captura válida quando o endereço automático falha', async () => {
    captureCurrentLocation.mockResolvedValueOnce(captured);
    reverseGeocode.mockRejectedValueOnce(new Error('sem resposta do mapa'));
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<LocationField value={emptyGps} onChange={onChange} error="" />);

    await user.click(screen.getByRole('button', { name: /Capturar minha posição/i }));

    expect(await screen.findByText(/digite o endereço se quiser/i)).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ lat: -16.6799, lng: -49.2553 });
  });

  it('mostra o mapa em somente leitura com a posição já capturada', () => {
    render(<LocationField
      value={{ ...emptyGps, ...captured, endereco: 'Rua 4 — Goiânia - GO' }}
      onChange={vi.fn()}
      error=""
    />);

    expect(screen.getByTestId('mapa')).toHaveTextContent('somente leitura');
    expect(screen.getByLabelText(/Endereço do ponto capturado/i)).toHaveValue('Rua 4 — Goiânia - GO');
  });

  it('lê o diagnóstico guardado da última captura mesmo sem tentar de novo', async () => {
    localStorage.setItem('bem-pro-goias:last-location-trace', JSON.stringify({
      platform: 'android',
      outcome: 'falha',
      totalMs: 45001,
      occurredAt: '2026-08-11T20:00:00.000Z',
      steps: [{ name: 'permissao-atual', ms: 12, detail: '{"location":"denied"}' }]
    }));
    const user = userEvent.setup();
    render(<LocationField value={emptyGps} onChange={vi.fn()} error="" />);

    await user.click(screen.getByRole('button', { name: /Ver diagnóstico da última captura/i }));

    expect(await screen.findByText(/permissao-atual/)).toBeInTheDocument();
    expect(screen.getByText(/resultado: falha/)).toBeInTheDocument();
  });
});
