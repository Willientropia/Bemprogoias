import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDocs, runTransaction, setDoc } from 'firebase/firestore';
import { localStore } from '../../src/services/localStore';
import { listVoters, saveVoter, syncPendingVoters } from '../../src/services/voters';

vi.mock('firebase/firestore', () => ({
  Timestamp: { fromDate: vi.fn((value) => value) },
  collection: vi.fn(() => ({})),
  deleteDoc: vi.fn(),
  doc: vi.fn((...parts) => ({ path: parts.slice(1).join('/') })),
  getDocs: vi.fn(),
  getCountFromServer: vi.fn(),
  limit: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-time'),
  setDoc: vi.fn(),
  startAfter: vi.fn(() => ({})),
  where: vi.fn(() => ({}))
}));
vi.mock('../../src/services/firebase', () => ({ db: {} }));
vi.mock('../../src/services/localStore', () => ({
  localStore: {
    listVoters: vi.fn(),
    getVoter: vi.fn(),
    putVoter: vi.fn(),
    deleteVoter: vi.fn(),
    pendingVoters: vi.fn(),
    findDuplicate: vi.fn()
  }
}));

const session = { campaignId: 'campaign-1', uid: 'leader-1' };
const form = {
  nome: 'João Teste',
  rg: '987654321',
  titulo: '',
  zona: '10',
  secao: '20',
  whatsapp: '62988887777',
  localizacao: { modo: 'gps', endereco: '', lat: -16.67, lng: -49.25, accuracy: 30, capturedAt: '' }
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  localStore.findDuplicate.mockResolvedValue(null);
  localStore.putVoter.mockResolvedValue(undefined);
  setDoc.mockResolvedValue(undefined);
});

afterEach(() => vi.useRealTimers());

describe('serviço de eleitores — tolerância a falhas', () => {
  it('não prende o salvamento quando o Firestore não responde', async () => {
    vi.useFakeTimers();
    runTransaction.mockReturnValue(new Promise(() => {}));

    const resultPromise = saveVoter(form, session);
    await vi.advanceTimersByTimeAsync(12_001);
    const saved = await resultPromise;

    expect(saved.syncStatus).toBe('pending');
    expect(saved.nome).toBe('João Teste');
    expect(saved.syncErrorMessage).toMatch(/12 segundos/i);
    expect(localStore.putVoter).toHaveBeenCalled();
  });

  it('mostra quando o Firebase recusou o cadastro em vez de esconder a falha', async () => {
    runTransaction.mockRejectedValue(Object.assign(new Error('Missing or insufficient permissions.'), {
      code: 'permission-denied'
    }));
    setDoc.mockRejectedValue(Object.assign(new Error('Missing or insufficient permissions.'), {
      code: 'permission-denied'
    }));

    const saved = await saveVoter(form, session);

    expect(saved.syncStatus).toBe('pending');
    expect(saved.syncErrorCode).toBe('permission-denied');
    expect(saved.syncErrorMessage).toMatch(/regras do Firestore foram publicadas/i);
    expect(localStore.putVoter).toHaveBeenLastCalledWith(expect.objectContaining({
      syncStatus: 'pending',
      syncErrorCode: 'permission-denied'
    }));
  });

  it('grava o eleitor mesmo quando as regras antigas ainda não possuem voterKeys', async () => {
    runTransaction.mockRejectedValue(Object.assign(new Error('Missing or insufficient permissions.'), {
      code: 'permission-denied'
    }));

    const saved = await saveVoter(form, { ...session, nome: 'Líder Teste', regiao: 'Centro', bairro: 'Setor Central' });

    expect(saved.syncStatus).toBe('synced');
    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringMatching(/campaigns\/campaign-1\/voters\//) }),
      expect.objectContaining({
        name: 'João Teste',
        normalizedName: 'joao teste',
        leaderId: 'leader-1',
        leaderName: 'Líder Teste',
        regiao: 'Centro',
        bairro: 'Setor Central',
        lat: -16.67,
        lng: -49.25,
        locationMode: 'gps',
        validationStatus: 'pendente',
        syncStatus: 'sincronizado',
        isDemo: false
      })
    );
  });

  it('envia o contrato de dados consumido pelo painel do gestor', async () => {
    const transaction = {
      get: vi.fn(async () => ({ exists: () => false, data: () => ({}) })),
      set: vi.fn(),
      delete: vi.fn()
    };
    runTransaction.mockImplementation(async (_database, operation) => operation(transaction));

    await saveVoter(form, { ...session, nome: 'Líder Teste', regiao: 'Centro', bairro: 'Setor Central' });

    const voterWrite = transaction.set.mock.calls.find(([reference]) => reference.path.includes('/voters/'));
    expect(voterWrite?.[1]).toEqual(expect.objectContaining({
      name: 'João Teste',
      normalizedName: 'joao teste',
      rg: '987654321',
      leaderId: 'leader-1',
      leaderName: 'Líder Teste',
      endereco: '',
      lat: -16.67,
      lng: -49.25,
      locationMode: 'gps',
      locationModeLabel: 'GPS do celular',
      validationStatus: 'pendente',
      syncStatus: 'sincronizado',
      createdAt: expect.any(Date),
      isDemo: false
    }));
  });

  it('mantém a falha de reconciliação visível e informa o motivo no relatório', async () => {
    const pending = {
      ...form,
      id: 'voter-pending',
      campaignId: session.campaignId,
      leaderId: session.uid,
      syncStatus: 'pending'
    };
    localStore.pendingVoters.mockResolvedValue([pending]);
    runTransaction.mockRejectedValue(Object.assign(new Error('Missing or insufficient permissions.'), {
      code: 'permission-denied'
    }));
    setDoc.mockRejectedValue(Object.assign(new Error('Missing or insufficient permissions.'), {
      code: 'permission-denied'
    }));

    const report = await syncPendingVoters(session);

    expect(report.failed).toBe(1);
    expect(report.errors).toEqual([expect.objectContaining({
      id: 'voter-pending',
      code: 'permission-denied'
    })]);
    expect(localStore.putVoter).toHaveBeenCalledWith(expect.objectContaining({
      id: 'voter-pending',
      syncErrorMessage: expect.stringMatching(/Firebase recusou/i)
    }));
  });

  it('normaliza um cadastro antigo antes de abrir a tela de detalhes', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    localStore.listVoters.mockResolvedValue([{
      id: 'legacy-1',
      nomeCompleto: 'Maria Antiga',
      telefone: '62999990000',
      rg: 123456,
      zona: 10,
      secao: 20,
      lat: '-16.67',
      lng: '-49.25'
    }]);

    const [voter] = await listVoters(session);

    expect(voter.nome).toBe('Maria Antiga');
    expect(voter.rg).toBe('123456');
    expect(voter.localizacao.lat).toBe(-16.67);
    expect(voter.localizacao.lng).toBe(-49.25);
    expect(getDocs).not.toHaveBeenCalled();
  });
});
