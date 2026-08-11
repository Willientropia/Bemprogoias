import { Capacitor } from '@capacitor/core';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { prepareNativeGeolocation } from './location';

const MIN_WRITE_INTERVAL_MS = 10_000;
const MIN_DISTANCE_METERS = 25;

function distanceMeters(previous, next) {
  if (!previous) return Number.POSITIVE_INFINITY;
  const radius = 6_371_000;
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const dLat = toRadians(next.lat - previous.lat);
  const dLng = toRadians(next.lng - previous.lng);
  const lat1 = toRadians(previous.lat);
  const lat2 = toRadians(next.lat);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toPosition(coords, timestamp = Date.now()) {
  return {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: Math.round(coords.accuracy || 0),
    heading: Number.isFinite(coords.heading) ? coords.heading : null,
    speed: Number.isFinite(coords.speed) ? coords.speed : null,
    deviceTimestamp: new Date(timestamp).toISOString()
  };
}

async function publishPosition(session, position, sharing) {
  await setDoc(
    doc(db, 'campaigns', session.campaignId, 'leaderLocations', session.uid),
    {
      ...position,
      campaignId: session.campaignId,
      leaderId: session.uid,
      sharing,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function nativeWatch(onPosition, onError) {
  // Desestruturado de propósito: o Proxy do plugin não pode ser o valor
  // resolvido de uma Promise. Ver o comentário em prepareNativeGeolocation.
  const { geolocation } = await prepareNativeGeolocation();
  const id = await geolocation.watchPosition(
    {
      enableHighAccuracy: true,
      timeout: 20_000,
      maximumAge: 5_000,
      minimumUpdateInterval: 5_000,
      enableLocationFallback: true
    },
    (position, error) => {
      if (error) onError(error);
      else if (position) onPosition(toPosition(position.coords, position.timestamp));
    }
  );
  return () => geolocation.clearWatch({ id });
}

function browserWatch(onPosition, onError) {
  if (!navigator.geolocation) throw new Error('Localização em tempo real indisponível neste navegador.');
  const id = navigator.geolocation.watchPosition(
    (position) => onPosition(toPosition(position.coords, position.timestamp)),
    (error) => {
      if (error.code === 1) navigator.geolocation.clearWatch(id);
      onError(error);
    },
    { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}

export async function startLeaderLocationSharing(session, callbacks = {}) {
  let stopped = false;
  let lastPublishedAt = 0;
  let lastPublishedPosition = null;

  function receive(position) {
    if (stopped) return;
    callbacks.onPosition?.(position);
    const now = Date.now();
    const moved = distanceMeters(lastPublishedPosition, position);
    if (lastPublishedAt && now - lastPublishedAt < MIN_WRITE_INTERVAL_MS && moved < MIN_DISTANCE_METERS) return;
    // Marca a janela antes do ACK remoto. Promessas do Firestore só resolvem
    // ao reconectar; aguardar aqui criaria várias gravações durante o offline.
    lastPublishedAt = now;
    lastPublishedPosition = position;
    publishPosition(session, position, true)
      .then(() => callbacks.onPublished?.(position))
      .catch((error) => callbacks.onError?.(error));
  }

  const reportError = (error) => callbacks.onError?.(
    new Error(error?.code === 1 ? 'A permissão de localização foi negada.' : error?.message || 'Não foi possível atualizar a posição.')
  );
  const clearWatch = Capacitor.isNativePlatform()
    ? await nativeWatch(receive, reportError)
    : browserWatch(receive, reportError);

  return {
    async stop() {
      if (stopped) return;
      stopped = true;
      await clearWatch();
      publishPosition(session, { stoppedAt: new Date().toISOString() }, false)
        .catch(() => {
          // O estado final fica na fila offline do Firestore e sincroniza ao reconectar.
        });
    }
  };
}

export function subscribeToLeaderLocations(campaignId, callback, onError) {
  return onSnapshot(
    collection(db, 'campaigns', campaignId, 'leaderLocations'),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError
  );
}

export function isFreshLeaderLocation(location, maxAgeMs = 90_000) {
  const timestampValue = location.updatedAt?.toMillis?.();
  const parsedDeviceTime = Date.parse(location.deviceTimestamp || '');
  const updatedAt = Number.isFinite(timestampValue)
    ? timestampValue
    : Number.isFinite(parsedDeviceTime) ? parsedDeviceTime : 0;
  return Boolean(location.sharing && updatedAt && Date.now() - updatedAt <= maxAgeMs);
}
