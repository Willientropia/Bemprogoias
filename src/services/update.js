import { Capacitor, registerPlugin } from '@capacitor/core';
import { doc, getDoc } from 'firebase/firestore';
import { runtime } from '../config/runtime';
import { compareVersions } from '../utils/version';
import { db } from './firebase';

const MobileUpdater = registerPlugin('MobileUpdater');

async function getMinimumVersion(campaignId) {
  if (!campaignId) return '';
  try {
    const snapshot = await getDoc(doc(db, 'campaigns', campaignId));
    return snapshot.exists() ? snapshot.data().minAppVersion || '' : '';
  } catch {
    return '';
  }
}

export async function checkForAppUpdate(campaignId) {
  const minAppVersion = await getMinimumVersion(campaignId);
  const required = Boolean(minAppVersion && compareVersions(runtime.version, minAppVersion) < 0);
  if (!runtime.githubRepo) {
    return { configured: false, currentVersion: runtime.version, minAppVersion, required };
  }
  const response = await fetch(`https://api.github.com/repos/${runtime.githubRepo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  if (!response.ok) throw new Error('Não foi possível consultar a versão mais recente.');
  const release = await response.json();
  const latestVersion = String(release.tag_name || '').replace(/^v/i, '');
  const apk = release.assets?.find((asset) => asset.name.toLowerCase().endsWith('.apk'));
  return {
    configured: true,
    currentVersion: runtime.version,
    latestVersion,
    available: compareVersions(latestVersion, runtime.version) > 0,
    minAppVersion,
    required,
    notes: release.body || '',
    pageUrl: release.html_url,
    apkUrl: apk?.browser_download_url || ''
  };
}

export async function installAndroidUpdate(apkUrl) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    throw new Error('A instalação direta de APK está disponível somente no Android.');
  }
  if (!apkUrl) throw new Error('A release não contém um arquivo APK.');
  const permission = await MobileUpdater.getInstallPermissionState();
  if (!permission.granted) {
    await MobileUpdater.openInstallPermissionSettings();
    return { awaitingPermission: true };
  }
  return MobileUpdater.downloadAndInstall({ url: apkUrl, fileName: 'bem-pro-goias-update.apk' });
}
