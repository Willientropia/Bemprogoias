import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Geolocation } from '@capacitor/geolocation';
import { captureCurrentLocation, prepareNativeGeolocation } from '../../src/services/location';

const nativeLocation = vi.hoisted(() => ({ getCurrentPosition: vi.fn() }));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => true) },
  registerPlugin: vi.fn(() => nativeLocation)
}));
// O objeto devolvido por registerPlugin é um Proxy que responde com uma função
// para QUALQUER propriedade — inclusive `then`. Um async function que dê
// `return` nesse objeto trava para sempre, porque o JavaScript o trata como
// Promise e chama um `then` nativo que nunca responde. O mock reproduz isso.
vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
    then: vi.fn()
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  Geolocation.checkPermissions.mockResolvedValue({ location: 'granted', coarseLocation: 'granted' });
  nativeLocation.getCurrentPosition.mockResolvedValue({
    coords: { latitude: -16.67, longitude: -49.25, accuracy: 25 },
    timestamp: Date.now()
  });
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: vi.fn() }
  });
});

afterEach(() => vi.useRealTimers());

describe('captura nativa de localização', () => {
  it('solicita a permissão do Android antes de capturar a primeira posição', async () => {
    Geolocation.checkPermissions.mockResolvedValue({ location: 'prompt', coarseLocation: 'prompt' });
    Geolocation.requestPermissions.mockResolvedValue({ location: 'granted', coarseLocation: 'granted' });

    const position = await captureCurrentLocation();

    expect(Geolocation.requestPermissions).toHaveBeenCalledWith({ permissions: ['location'] });
    expect(nativeLocation.getCurrentPosition).toHaveBeenCalled();
    expect(position).toMatchObject({ lat: -16.67, lng: -49.25, accuracy: 25 });
  });

  it('usa a localização do WebView quando o provedor nativo falha', async () => {
    nativeLocation.getCurrentPosition.mockRejectedValue(new Error('provedor nativo indisponível'));
    navigator.geolocation.getCurrentPosition.mockImplementation((success) => success({
      coords: { latitude: -16.68, longitude: -49.26, accuracy: 40 },
      timestamp: Date.now()
    }));

    const position = await captureCurrentLocation();

    expect(position).toMatchObject({ lat: -16.68, lng: -49.26, accuracy: 40 });
  });

  it('encerra com erro em vez de girar infinitamente quando nenhum provedor responde', async () => {
    vi.useFakeTimers();
    nativeLocation.getCurrentPosition.mockReturnValue(new Promise(() => {}));
    navigator.geolocation.getCurrentPosition.mockImplementation(() => {});

    const resultPromise = captureCurrentLocation();
    const assertion = expect(resultPromise).rejects.toThrow(/12 segundos/i);
    await vi.advanceTimersByTimeAsync(12_001);
    await assertion;
  });

  it('relata cada etapa e anexa o diagnóstico ao erro', async () => {
    nativeLocation.getCurrentPosition.mockRejectedValue(new Error('provedor nativo indisponível'));
    navigator.geolocation.getCurrentPosition.mockImplementation((_success, failure) => failure(new Error('WebView sem sinal')));
    const steps = [];

    await expect(captureCurrentLocation({ onStep: (name) => steps.push(name) })).rejects.toMatchObject({
      trace: expect.stringContaining('provedor-nativo: falhou')
    });

    expect(steps).toContain('inicio');
    expect(steps).toContain('permissao-ok');
    expect(steps).toContain('provedor-nativo: chamando');
    expect(JSON.parse(localStorage.getItem('bem-pro-goias:last-location-trace')).outcome).toBe('falha');
  });

  it('guarda o diagnóstico da captura bem-sucedida', async () => {
    await captureCurrentLocation();

    const report = JSON.parse(localStorage.getItem('bem-pro-goias:last-location-trace'));
    expect(report.outcome).toBe('sucesso');
    expect(report.steps.map((item) => item.name)).toContain('provedor-nativo: respondeu');
  });

  it('nunca resolve a Promise com o Proxy do plugin', async () => {
    const result = await prepareNativeGeolocation();

    // Se o Proxy virar o valor resolvido, o JavaScript chama o `then` dele —
    // uma chamada nativa que não existe e nunca responde.
    expect(Geolocation.then).not.toHaveBeenCalled();
    expect(result.geolocation).toBe(Geolocation);
    expect(result).not.toBe(Geolocation);
  });

  it('não trava quando o módulo de geolocalização nunca carrega', async () => {
    vi.useFakeTimers();
    Geolocation.checkPermissions.mockReturnValue(new Promise(() => {}));

    const resultPromise = captureCurrentLocation();
    const assertion = expect(resultPromise).rejects.toThrow(/não respondeu ao verificar a permissão/i);
    await vi.advanceTimersByTimeAsync(10_001);
    await assertion;
  });
});
