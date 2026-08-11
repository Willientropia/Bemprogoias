import { registerSW } from 'virtual:pwa-register';

let updateServiceWorker;

export function registerPwa({ onUpdate, onReady } = {}) {
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh: () => onUpdate?.(),
    onOfflineReady: () => onReady?.(),
    onRegisterError: (error) => console.error('Falha ao registrar o service worker', error)
  });
}

export function applyPwaUpdate() {
  return updateServiceWorker?.(true);
}

export async function disableNativePwaCache() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ('caches' in globalThis) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }
}
