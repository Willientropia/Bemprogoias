import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  where
} from 'firebase/firestore';
import { createId, normalizeRg, normalizeTitle, normalizeWhatsApp } from '../utils/normalizers';
import { withTimeout } from '../utils/async';
import { db } from './firebase';
import { localStore } from './localStore';

const FIRESTORE_READ_TIMEOUT_MS = 8_000;
const FIRESTORE_WRITE_TIMEOUT_MS = 12_000;
export const VOTERS_PAGE_SIZE = 50;

function votersRef(campaignId) {
  return collection(db, `campaigns/${campaignId}/voters`);
}

// API consumida pelo painel do gestor (Dev A). Ela permanece no mesmo
// serviço para que o app de campo e o painel compartilhem um único contrato.
export async function fetchVoterStats(campaignId) {
  const ref = votersRef(campaignId);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const [totalSnapshot, weekSnapshot, validatedSnapshot] = await Promise.all([
    getCountFromServer(ref),
    getCountFromServer(query(ref, where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)))),
    getCountFromServer(query(ref, where('validationStatus', '==', 'validado')))
  ]);
  const total = totalSnapshot.data().count;
  const week = weekSnapshot.data().count;
  const validated = validatedSnapshot.data().count;
  return {
    total,
    week,
    validated,
    validationRate: total === 0 ? 0 : Math.round((validated / total) * 100)
  };
}

export async function fetchVotersPage({
  campaignId,
  leaderId = 'todos',
  validationStatus = 'todos',
  cursor = null,
  pageSize = VOTERS_PAGE_SIZE
}) {
  const constraints = [];
  if (leaderId !== 'todos') constraints.push(where('leaderId', '==', leaderId));
  if (validationStatus !== 'todos') constraints.push(where('validationStatus', '==', validationStatus));
  constraints.push(orderBy('createdAt', 'desc'));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize));
  const snapshot = await getDocs(query(votersRef(campaignId), ...constraints));
  return {
    voters: snapshot.docs.map((document) => ({ id: document.id, ...document.data() })),
    cursor: snapshot.docs.at(-1) ?? null,
    hasMore: snapshot.size === pageSize
  };
}

function errorCode(error) {
  return asText(error?.code || error?.name || 'unknown').replace(/^firestore\//, '');
}

export function describeFirestoreError(error) {
  const code = errorCode(error);
  if (code === 'permission-denied') {
    return 'O Firebase recusou o envio. Verifique se as regras do Firestore foram publicadas e se este usuário é líder desta campanha.';
  }
  if (code === 'unauthenticated') {
    return 'A sessão do Firebase expirou. Saia da conta, entre novamente e tente sincronizar.';
  }
  if (code === 'failed-precondition') {
    return 'O Firestore exige uma configuração ou índice que ainda não foi publicado.';
  }
  if (code === 'unavailable') {
    return 'O Firebase está indisponível no momento. Confira a internet e tente novamente.';
  }
  if (/tempo limite/i.test(error?.message || '')) {
    return 'O Firebase demorou mais de 12 segundos para responder. O cadastro continua salvo no aparelho.';
  }
  return `Não foi possível enviar ao Firebase${error?.message ? `: ${error.message}` : '.'}`;
}

function withSyncError(record, error) {
  return {
    ...record,
    syncStatus: 'pending',
    syncErrorCode: errorCode(error),
    syncErrorMessage: describeFirestoreError(error),
    lastSyncAttemptAt: new Date().toISOString()
  };
}

function markSynced(record) {
  const synced = {
    ...record,
    syncStatus: 'synced',
    previousRgNormalized: record.rgNormalized,
    previousTituloNormalized: record.tituloNormalized
  };
  delete synced.syncErrorCode;
  delete synced.syncErrorMessage;
  delete synced.lastSyncAttemptAt;
  return synced;
}

function asText(value) {
  return value == null ? '' : String(value);
}

function asCoordinate(value) {
  if (Number.isFinite(value)) return value;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeName(value) {
  return asText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function cloudLocationMode(mode) {
  return mode === 'mapa' ? 'pin' : ['gps', 'manual', 'pin'].includes(mode) ? mode : 'manual';
}

function locationModeLabel(mode) {
  return ({ gps: 'GPS do celular', manual: 'Endereço digitado', pin: 'Pin no mapa' })[mode];
}

export function normalizeVoterRecord(record = {}, session = {}) {
  record = record && typeof record === 'object' ? record : {};
  session = session && typeof session === 'object' ? session : {};
  const rawLocation = record.localizacao && typeof record.localizacao === 'object'
    ? record.localizacao
    : {};
  return {
    ...record,
    id: asText(record.id) || createId(),
    campaignId: asText(record.campaignId || session.campaignId),
    leaderId: asText(record.leaderId || session.uid),
    nome: asText(record.nome || record.nomeCompleto || record.name),
    rg: asText(record.rg),
    titulo: asText(record.titulo),
    zona: asText(record.zona),
    secao: asText(record.secao),
    whatsapp: asText(record.whatsapp || record.telefone),
    localizacao: {
      ...rawLocation,
      modo: ['gps', 'manual', 'mapa'].includes(rawLocation.modo) ? rawLocation.modo : 'manual',
      endereco: asText(rawLocation.endereco || record.endereco),
      lat: asCoordinate(rawLocation.lat ?? record.lat),
      lng: asCoordinate(rawLocation.lng ?? record.lng),
      accuracy: asCoordinate(rawLocation.accuracy),
      capturedAt: asText(rawLocation.capturedAt)
    },
    syncStatus: asText(record.syncStatus) || 'synced'
  };
}

export class DuplicateVoterError extends Error {
  constructor(field, existingId) {
    super(`Já existe um eleitor com este ${field === 'rg' ? 'RG' : 'título'} na campanha.`);
    this.name = 'DuplicateVoterError';
    this.code = 'duplicate-voter';
    this.field = field;
    this.existingId = existingId;
  }
}

function prepareRecord(input, session, current) {
  const now = new Date().toISOString();
  const safeInput = normalizeVoterRecord(input, session);
  return {
    ...current,
    ...safeInput,
    id: current?.id || safeInput.id || createId(),
    campaignId: session.campaignId,
    leaderId: session.uid,
    nome: safeInput.nome.trim(),
    rg: safeInput.rg.trim(),
    rgNormalized: normalizeRg(safeInput.rg),
    titulo: safeInput.titulo.trim(),
    tituloNormalized: normalizeTitle(safeInput.titulo),
    zona: safeInput.zona.trim(),
    secao: safeInput.secao.trim(),
    whatsapp: safeInput.whatsapp.trim(),
    whatsappNormalized: normalizeWhatsApp(safeInput.whatsapp),
    leaderName: asText(current?.leaderName || session.nome),
    regiao: asText(current?.regiao || session.regiao),
    bairro: asText(current?.bairro || session.bairro),
    localizacao: { ...safeInput.localizacao },
    createdAt: current?.createdAt || now,
    updatedAt: now,
    syncStatus: 'pending',
    conflictMessage: '',
    syncErrorCode: '',
    syncErrorMessage: '',
    lastSyncAttemptAt: '',
    _deleted: false,
    previousRgNormalized: current?.rgNormalized || '',
    previousTituloNormalized: current?.tituloNormalized || ''
  };
}

function uniqueKeyRef(db, campaignId, kind, value) {
  return doc(db, 'campaigns', campaignId, 'voterKeys', `${kind}_${value}`);
}

function publicCloudRecord(record, { uniqueDocument = true } = {}) {
  const location = record.localizacao && typeof record.localizacao === 'object'
    ? record.localizacao
    : {};
  const mode = cloudLocationMode(location.modo);
  return {
    campaignId: record.campaignId,
    leaderId: record.leaderId,
    leaderName: asText(record.leaderName),
    name: asText(record.nome),
    normalizedName: normalizeName(record.nome),
    rg: asText(record.rg),
    rgNormalized: asText(record.rgNormalized),
    titulo: asText(record.titulo) || null,
    tituloNormalized: asText(record.tituloNormalized) || null,
    zona: asText(record.zona),
    secao: asText(record.secao),
    whatsapp: asText(record.whatsapp),
    regiao: asText(record.regiao),
    bairro: asText(record.bairro),
    endereco: asText(location.endereco),
    lat: asCoordinate(location.lat),
    lng: asCoordinate(location.lng),
    locationAccuracy: asCoordinate(location.accuracy),
    locationCapturedAt: asText(location.capturedAt) || null,
    locationMode: mode,
    locationModeLabel: locationModeLabel(mode),
    source: asText(record.source) || 'Trabalho de campo',
    validationStatus: asText(record.validationStatus) || 'pendente',
    validationMethod: record.validationMethod || 'contato_pendente',
    validationReason: record.validationReason || 'Aguardando validação do contato informado',
    validationChecks: record.validationChecks || {
      requiredFields: true,
      uniqueDocument,
      contactConfirmed: false,
      geoCoherent: Number.isFinite(asCoordinate(location.lat)) && Number.isFinite(asCoordinate(location.lng))
    },
    validatedAt: record.validatedAt || null,
    syncStatus: 'sincronizado',
    createdAt: validDate(record.createdAt),
    updatedAt: serverTimestamp(),
    isDemo: false
  };
}

async function pushRecordWithoutUniqueKeys(record, voterRef) {
  if (record._deleted) await deleteDoc(voterRef);
  else await setDoc(voterRef, publicCloudRecord(record, { uniqueDocument: false }));
}

async function pushRecord(record) {
  const voterRef = doc(db, 'campaigns', record.campaignId, 'voters', record.id);

  try {
    if (record._deleted) {
      await runTransaction(db, async (transaction) => {
        const refs = [];
        if (record.rgNormalized) refs.push(uniqueKeyRef(db, record.campaignId, 'rg', record.rgNormalized));
        if (record.tituloNormalized) refs.push(uniqueKeyRef(db, record.campaignId, 'titulo', record.tituloNormalized));
        const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
        snapshots.forEach((snapshot, index) => {
          if (snapshot.exists() && snapshot.data().voterId === record.id) transaction.delete(refs[index]);
        });
        transaction.delete(voterRef);
      });
      return;
    }

    await runTransaction(db, async (transaction) => {
      const refs = [];
      if (record.rgNormalized) refs.push({
        field: 'rg',
        ref: uniqueKeyRef(db, record.campaignId, 'rg', record.rgNormalized)
      });
      if (record.tituloNormalized) refs.push({
        field: 'titulo',
        ref: uniqueKeyRef(db, record.campaignId, 'titulo', record.tituloNormalized)
      });
      const snapshots = await Promise.all(refs.map(({ ref }) => transaction.get(ref)));
      snapshots.forEach((snapshot, index) => {
        if (snapshot.exists() && snapshot.data().voterId !== record.id) {
          throw new DuplicateVoterError(refs[index].field, snapshot.data().voterId);
        }
      });

      const obsoleteRefs = [];
      if (record.previousRgNormalized && record.previousRgNormalized !== record.rgNormalized) {
        obsoleteRefs.push(uniqueKeyRef(db, record.campaignId, 'rg', record.previousRgNormalized));
      }
      if (record.previousTituloNormalized && record.previousTituloNormalized !== record.tituloNormalized) {
        obsoleteRefs.push(uniqueKeyRef(db, record.campaignId, 'titulo', record.previousTituloNormalized));
      }
      const obsoleteSnapshots = await Promise.all(obsoleteRefs.map((ref) => transaction.get(ref)));

      transaction.set(voterRef, publicCloudRecord(record));
      refs.forEach(({ ref, field }) => transaction.set(ref, {
        campaignId: record.campaignId,
        voterId: record.id,
        leaderId: record.leaderId,
        field,
        value: field === 'rg' ? record.rgNormalized : record.tituloNormalized,
        updatedAt: serverTimestamp()
      }));
      obsoleteSnapshots.forEach((snapshot, index) => {
        if (snapshot.exists() && snapshot.data().voterId === record.id) transaction.delete(obsoleteRefs[index]);
      });
    });
  } catch (error) {
    // Compatibilidade com as regras publicadas pelo Dev A antes da coleção
    // voterKeys existir. A gravação principal continua funcionando e, assim
    // que as regras novas forem publicadas, a reserva atômica volta a operar.
    if (errorCode(error) === 'permission-denied') {
      await pushRecordWithoutUniqueKeys(record, voterRef);
      return;
    }
    throw error;
  }
}

export async function listVoters(session) {
  const local = (await localStore.listVoters(session.campaignId, session.uid))
    .map((record) => normalizeVoterRecord(record, session));
  if (!navigator.onLine) return local;
  try {
    const votersQuery = query(
      collection(db, 'campaigns', session.campaignId, 'voters'),
      where('leaderId', '==', session.uid)
    );
    const snapshot = await withTimeout(
      getDocs(votersQuery),
      FIRESTORE_READ_TIMEOUT_MS,
      () => new Error('Tempo limite ao consultar eleitores no Firestore.')
    );
    for (const item of snapshot.docs) {
      const previous = await localStore.getVoter(item.id);
      if (previous?.syncStatus === 'pending' || previous?.syncStatus === 'conflict') continue;
      const data = item.data();
      await localStore.putVoter(normalizeVoterRecord({
        ...data,
        id: item.id,
        campaignId: session.campaignId,
        leaderId: session.uid,
        createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt || new Date().toISOString(),
        syncStatus: 'synced'
      }, session));
    }
    return (await localStore.listVoters(session.campaignId, session.uid))
      .map((record) => normalizeVoterRecord(record, session));
  } catch {
    return local;
  }
}

export async function saveVoter(input, session, current = null) {
  const record = prepareRecord(input, session, current);
  const duplicate = await localStore.findDuplicate({
    campaignId: session.campaignId,
    rgNormalized: record.rgNormalized,
    tituloNormalized: record.tituloNormalized,
    excludeId: record.id
  });
  if (duplicate) {
    const field = duplicate.rgNormalized === record.rgNormalized ? 'rg' : 'titulo';
    throw new DuplicateVoterError(field, duplicate.id);
  }
  await localStore.putVoter(record);
  if (navigator.onLine) {
    try {
      await withTimeout(
        pushRecord(record),
        FIRESTORE_WRITE_TIMEOUT_MS,
        () => new Error('Tempo limite ao salvar no Firestore.')
      );
      const synced = markSynced(record);
      await localStore.putVoter(synced);
      return synced;
    } catch (error) {
      if (error.code === 'duplicate-voter') {
        await localStore.putVoter({ ...record, syncStatus: 'conflict', conflictMessage: error.message });
        throw error;
      }
      const pending = withSyncError(record, error);
      await localStore.putVoter(pending);
      return pending;
    }
  }
  return record;
}

export async function removeVoter(voter) {
  const pendingDelete = { ...voter, _deleted: true, syncStatus: 'pending', updatedAt: new Date().toISOString() };
  await localStore.putVoter(pendingDelete);
  if (navigator.onLine) {
    try {
      await withTimeout(
        pushRecord(pendingDelete),
        FIRESTORE_WRITE_TIMEOUT_MS,
        () => new Error('Tempo limite ao excluir no Firestore.')
      );
      await localStore.deleteVoter(voter.id);
      return { ...pendingDelete, syncStatus: 'synced' };
    } catch (error) {
      const pending = withSyncError(pendingDelete, error);
      await localStore.putVoter(pending);
      return pending;
    }
  }
  return pendingDelete;
}

export async function syncPendingVoters(session) {
  if (!navigator.onLine) return { synced: 0, conflicts: [], failed: 0, errors: [] };
  const pending = await localStore.pendingVoters(session.campaignId, session.uid);
  const report = { synced: 0, conflicts: [], failed: 0, errors: [] };
  for (const record of pending) {
    try {
      await withTimeout(
        pushRecord(record),
        FIRESTORE_WRITE_TIMEOUT_MS,
        () => new Error('Tempo limite ao sincronizar com o Firestore.')
      );
      if (record._deleted) await localStore.deleteVoter(record.id);
      else await localStore.putVoter(markSynced(record));
      report.synced += 1;
    } catch (error) {
      if (error.code === 'duplicate-voter') {
        report.conflicts.push({ id: record.id, message: error.message });
        await localStore.putVoter({ ...record, syncStatus: 'conflict', conflictMessage: error.message });
      } else {
        report.failed += 1;
        const failed = withSyncError(record, error);
        await localStore.putVoter(failed);
        report.errors.push({ id: record.id, code: failed.syncErrorCode, message: failed.syncErrorMessage });
      }
    }
  }
  return report;
}
