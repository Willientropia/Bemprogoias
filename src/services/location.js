import { Capacitor, registerPlugin } from '@capacitor/core';
import { withTimeout } from '../utils/async';
import { createLocationTrace } from './locationDiagnostics';

const PERMISSION_TIMEOUT_MS = 30_000;
const POSITION_TIMEOUT_MS = 12_000;
const PLUGIN_IMPORT_TIMEOUT_MS = 8_000;
// Teto absoluto: nenhuma etapa pode deixar o botão em "Obtendo sinal…" além
// disto, mesmo que um provedor do Android nunca chame o callback de volta.
const CAPTURE_TIMEOUT_MS = 45_000;

const NativeLocation = registerPlugin('NativeLocation');

const noop = () => {};

export class LocationPermissionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LocationPermissionError';
    this.code = 'location-permission-denied';
  }
}

function browserPosition(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS indisponível neste dispositivo.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

// Envolve cada provedor para que uma exceção síncrona (plugin ausente, por
// exemplo) vire rejeição rastreada em vez de derrubar a captura inteira.
function attempt(name, run, track) {
  const startedAt = Date.now();
  track(`${name}: chamando`);
  return Promise.resolve()
    .then(run)
    .then(
      (value) => {
        track(`${name}: respondeu`, `${Date.now() - startedAt}ms`);
        return value;
      },
      (error) => {
        track(`${name}: falhou`, error);
        throw error;
      }
    );
}

function firstSuccessful(promises) {
  return new Promise((resolve, reject) => {
    const errors = [];
    let remaining = promises.length;
    promises.forEach((promise) => Promise.resolve(promise).then(resolve).catch((error) => {
      errors.push(error);
      remaining -= 1;
      if (!remaining) reject(errors.find((item) => item?.code === 'LOCATION_PERMISSION_DENIED') || errors[0]);
    }));
  });
}

function validPosition(position) {
  const latitude = Number(position?.coords?.latitude);
  const longitude = Number(position?.coords?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('O provedor respondeu sem uma coordenada válida.');
  }
  return {
    lat: latitude,
    lng: longitude,
    accuracy: Math.round(Number(position.coords.accuracy) || 0),
    capturedAt: new Date(Number(position.timestamp) || Date.now()).toISOString()
  };
}

function nativeLocationError(error) {
  const code = error?.code || '';
  if (code === 'LOCATION_DISABLED' || code === 'OS-PLUG-GLOC-0007' || code === 'OS-PLUG-GLOC-0017') {
    return new Error('Ative a Localização/GPS do celular e tente novamente.');
  }
  if (code === 'LOCATION_TIMEOUT' || code === 'OS-PLUG-GLOC-0010') {
    return new Error('O GPS demorou para responder. Tente novamente em local aberto.');
  }
  if (code === 'OS-PLUG-GLOC-0018') {
    return new Error('O APK não declarou a permissão de localização. Instale a versão mais recente.');
  }
  if (code === 'LOCATION_PERMISSION_DENIED' || code === 'OS-PLUG-GLOC-0003' || code === 'OS-PLUG-GLOC-0009') {
    return new LocationPermissionError('A localização foi negada. Libere a permissão do app nas configurações do celular.');
  }
  return new Error(error?.message || 'Não foi possível obter sua localização.');
}

// O plugin sai embrulhado num objeto simples de propósito. `registerPlugin`
// devolve um Proxy que responde com uma função para qualquer propriedade,
// inclusive `then` — devolver esse Proxy direto de uma async function faz o
// JavaScript tratá-lo como Promise e chamar um `then` nativo que nunca
// responde. Era isso que travava o botão em "Obtendo sinal…" para sempre.
export async function prepareNativeGeolocation(track = noop) {
  track('importa-plugin');
  const { Geolocation } = await withTimeout(
    import('@capacitor/geolocation'),
    PLUGIN_IMPORT_TIMEOUT_MS,
    () => new Error('O módulo de geolocalização não carregou. Reinstale ou reinicie o aplicativo.')
  );
  track('plugin-importado');

  let permission;
  try {
    permission = await withTimeout(
      Geolocation.checkPermissions(),
      10_000,
      () => new Error('O Android não respondeu ao verificar a permissão de localização.')
    );
    track('permissao-atual', permission);
  } catch (error) {
    track('permissao-checagem-falhou', error);
    throw nativeLocationError(error);
  }

  const isGranted = permission.location === 'granted' || permission.coarseLocation === 'granted';
  if (!isGranted) {
    try {
      track('pede-permissao');
      permission = await withTimeout(
        Geolocation.requestPermissions({ permissions: ['location'] }),
        PERMISSION_TIMEOUT_MS,
        () => new LocationPermissionError('A autorização demorou demais. Toque novamente e responda à solicitação do Android.')
      );
      track('permissao-respondida', permission);
    } catch (error) {
      track('permissao-pedido-falhou', error);
      throw nativeLocationError(error);
    }
  }

  if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
    track('permissao-negada', permission);
    throw new LocationPermissionError('Permita a localização durante o uso do app para capturar a posição.');
  }
  track('permissao-ok');
  return { geolocation: Geolocation };
}

async function runCapture(track, native) {
  if (native) {
    await prepareNativeGeolocation(track);
    let position;
    try {
      position = await withTimeout(firstSuccessful([
        attempt('provedor-nativo', () => NativeLocation.getCurrentPosition({ timeout: 10_000, maximumAge: 300_000 }), track),
        attempt('provedor-webview', () => browserPosition({ enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }), track)
      ]), POSITION_TIMEOUT_MS, () => new Error('Nenhum provedor respondeu em 12 segundos. Confirme que a Localização do celular está ativada.'));
    } catch (error) {
      throw nativeLocationError(error);
    }
    return validPosition(position);
  }

  try {
    const position = await withTimeout(
      attempt('provedor-navegador', () => browserPosition({ enableHighAccuracy: false, timeout: 12_000, maximumAge: 30_000 }), track),
      POSITION_TIMEOUT_MS,
      () => new Error('O GPS demorou para responder. Verifique se a localização está ativada e tente novamente.')
    );
    return validPosition(position);
  } catch (error) {
    if (error.code === error.PERMISSION_DENIED || error.code === 1) {
      throw new LocationPermissionError('O acesso ao GPS foi negado. Libere a localização nas configurações do navegador.');
    }
    if (error.code === 3) throw new Error('O GPS demorou para responder. Tente novamente em local aberto.');
    throw error instanceof Error ? error : new Error('Não foi possível obter sua localização.');
  }
}

export async function captureCurrentLocation({ onStep } = {}) {
  const native = Capacitor.isNativePlatform();
  const platform = native ? (Capacitor.getPlatform?.() || 'nativa') : 'web';
  const trace = createLocationTrace(platform);
  const track = (name, detail) => {
    trace.step(name, detail);
    onStep?.(name, trace);
  };

  track('inicio');
  try {
    const position = await withTimeout(
      runCapture(track, native),
      CAPTURE_TIMEOUT_MS,
      () => new Error('A captura passou de 45 segundos sem resposta. Veja o diagnóstico para saber em qual etapa parou.')
    );
    trace.finish('sucesso', `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)} ±${position.accuracy}m`);
    return position;
  } catch (error) {
    trace.finish('falha', error);
    error.trace = trace.toText();
    throw error;
  }
}
