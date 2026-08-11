import { Capacitor } from '@capacitor/core';
import { normalizeWhatsApp } from '../utils/normalizers';

export function createWhatsAppUrl(phone, text = '') {
  const number = normalizeWhatsApp(phone);
  if (!number) throw new Error('Este eleitor não possui WhatsApp válido.');
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${number}${query}`;
}

export async function openWhatsApp(phone, text = '') {
  const url = createWhatsAppUrl(phone, text);
  if (Capacitor.isNativePlatform()) {
    const { AppLauncher } = await import('@capacitor/app-launcher');
    await AppLauncher.openUrl({ url });
    return;
  }
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) window.location.assign(url);
}
