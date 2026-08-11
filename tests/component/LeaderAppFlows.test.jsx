import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LeaderApp from '../../src/pages/leader/LeaderApp';
import { useAuth } from '../../src/contexts/AuthContext';
import { useOnlineStatus } from '../../src/hooks/useOnlineStatus';
import { listVoters, saveVoter, syncPendingVoters } from '../../src/services/voters';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { disableNativePwaCache } from '../../src/services/pwa';

const state = vi.hoisted(() => ({ voters: [] }));

vi.mock('../../src/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../src/hooks/useOnlineStatus', () => ({ useOnlineStatus: vi.fn() }));
vi.mock('../../src/services/pwa', () => ({ registerPwa: vi.fn(), applyPwaUpdate: vi.fn(), disableNativePwaCache: vi.fn(() => Promise.resolve()) }));
vi.mock('../../src/services/liveLocation', () => ({ startLeaderLocationSharing: vi.fn() }));
vi.mock('../../src/services/update', () => ({ checkForAppUpdate: vi.fn(() => Promise.resolve({ available: false })), installAndroidUpdate: vi.fn() }));
vi.mock('../../src/services/messaging', () => ({ openWhatsApp: vi.fn() }));
vi.mock('../../src/services/location', () => ({ captureCurrentLocation: vi.fn() }));
vi.mock('../../src/services/voters', () => ({
  listVoters: vi.fn(),
  saveVoter: vi.fn(),
  removeVoter: vi.fn(),
  syncPendingVoters: vi.fn()
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => 'web')
  }
}));
vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn(), minimizeApp: vi.fn() }
}));

const recentVoter = {
  id: 'voter-1',
  nomeCompleto: 'Maria da Silva',
  rg: '123456789',
  titulo: '',
  zona: '133',
  secao: '0245',
  whatsapp: '62999990000',
  localizacao: { modo: 'manual', endereco: 'Centro, Goiânia' },
  syncStatus: 'synced'
};

// Documento antigo do Firestore que escapou da normalização: todo campo que a
// tela imprime chega como objeto, número ou nulo em vez de texto.
const legacyVoter = {
  id: 'legacy-1',
  nome: { primeiro: 'Ana' },
  rg: { valor: '123456789' },
  titulo: { valor: '000111222333' },
  zona: { valor: 10 },
  secao: null,
  whatsapp: 62999990000,
  localizacao: { modo: 'manual', endereco: { rua: 'Centro' } },
  syncStatus: 'conflict',
  conflictMessage: { texto: 'RG duplicado' }
};

beforeEach(() => {
  vi.clearAllMocks();
  state.voters = [recentVoter];
  window.scrollTo = vi.fn();
  useAuth.mockReturnValue({
    user: { uid: 'leader-1', email: 'lider@teste.com', displayName: 'Líder Teste' },
    profile: { name: 'Líder Teste' },
    campaignId: 'campaign-1',
    logout: vi.fn()
  });
  useOnlineStatus.mockReturnValue(true);
  listVoters.mockImplementation(async () => state.voters);
  syncPendingVoters.mockResolvedValue({ synced: 0, conflicts: [], failed: 0 });
  saveVoter.mockImplementation(async (form) => {
    const saved = { ...form, id: 'voter-new', campaignId: 'campaign-1', leaderId: 'leader-1', syncStatus: 'synced' };
    state.voters = [saved, ...state.voters];
    return saved;
  });
  Capacitor.isNativePlatform.mockReturnValue(false);
  Capacitor.getPlatform.mockReturnValue('web');
  CapacitorApp.addListener.mockResolvedValue({ remove: vi.fn() });
});

async function renderLeader() {
  render(<LeaderApp />);
  await screen.findByText('Cadastros recentes');
}

describe('LeaderApp — fluxos críticos do Android', () => {
  it('abre um cadastro recente antigo sem produzir tela branca e volta para a lista', async () => {
    const user = userEvent.setup();
    await renderLeader();

    await user.click(screen.getByRole('button', { name: /Zona 133/i }));
    expect(await screen.findByRole('heading', { name: 'Maria da Silva' })).toBeInTheDocument();
    expect(screen.getByText('Detalhes do eleitor')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(await screen.findByRole('heading', { name: 'Eleitores' })).toBeInTheDocument();
  });

  it('salva um novo eleitor e mostra imediatamente a lista com o cadastro', async () => {
    const user = userEvent.setup();
    await renderLeader();

    await user.click(screen.getByRole('button', { name: /Novo eleitor/i }));
    await user.type(screen.getByLabelText(/Nome completo/i), 'João Teste');
    await user.type(screen.getByLabelText(/^RG/i), '987654321');
    await user.type(screen.getByLabelText(/WhatsApp/i), '62988887777');
    await user.type(screen.getByLabelText(/^Zona/i), '10');
    await user.type(screen.getByLabelText(/^Seção/i), '20');
    await user.click(screen.getByRole('tab', { name: /Endereço/i }));
    await user.type(screen.getByLabelText(/Endereço completo/i), 'Praça Cívica, Goiânia');
    await user.click(screen.getByRole('button', { name: /Salvar eleitor/i }));

    expect(await screen.findByRole('heading', { name: 'Eleitores' })).toBeInTheDocument();
    expect(await screen.findByText('João Teste')).toBeInTheDocument();
    expect(saveVoter).toHaveBeenCalledTimes(1);
  });

  it('usa o botão físico Voltar do Android para sair da lista e retornar ao início', async () => {
    Capacitor.isNativePlatform.mockReturnValue(true);
    Capacitor.getPlatform.mockReturnValue('android');
    const user = userEvent.setup();
    await renderLeader();
    await waitFor(() => expect(CapacitorApp.addListener).toHaveBeenCalledWith('backButton', expect.any(Function)));
    expect(disableNativePwaCache).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Eleitores/i }));
    expect(await screen.findByRole('heading', { name: 'Eleitores' })).toBeInTheDocument();

    const backHandler = CapacitorApp.addListener.mock.calls.find(([event]) => event === 'backButton')[1];
    act(() => backHandler());
    expect(await screen.findByText('Cadastros recentes')).toBeInTheDocument();
  });

  it('volta do formulário para a lista mesmo com um cadastro antigo malformado', async () => {
    state.voters = [null, {
      id: 'legacy-corrupt',
      nome: { valorAntigo: 'registro inválido' },
      zona: { valor: 10 },
      secao: null,
      syncStatus: 'pending',
      syncErrorMessage: 'Falha anterior'
    }];
    const user = userEvent.setup();
    await renderLeader();

    await user.click(screen.getByRole('button', { name: /Novo eleitor/i }));
    expect(await screen.findByRole('heading', { name: /Cadastrar eleitor/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(await screen.findByRole('heading', { name: 'Eleitores' })).toBeInTheDocument();
    expect(screen.getByText('Eleitor sem nome')).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível abrir esta tela')).not.toBeInTheDocument();
  });

  // Alguns WebView do Android devolvem um valor de window.scrollTo. Um efeito
  // que retorna esse valor faz o React tratá-lo como função de limpeza e
  // quebrar ao desmontar o formulário ("l is not a function" no bundle).
  it('sai do formulário sem quebrar quando window.scrollTo devolve um valor', async () => {
    window.scrollTo = vi.fn(() => 'posicao-aplicada');
    const user = userEvent.setup();
    await renderLeader();

    await user.click(screen.getByRole('button', { name: /Novo eleitor/i }));
    expect(await screen.findByRole('heading', { name: /Cadastrar eleitor/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(await screen.findByRole('heading', { name: 'Eleitores' })).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível abrir esta tela')).not.toBeInTheDocument();
  });

  it('abre o detalhe de um cadastro antigo malformado e volta pela seta sem tela de erro', async () => {
    state.voters = [legacyVoter];
    const user = userEvent.setup();
    await renderLeader();

    await user.click(screen.getByRole('button', { name: /Eleitor sem nome/i }));
    expect(await screen.findByText('Detalhes do eleitor')).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível abrir esta tela')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(await screen.findByRole('heading', { name: 'Eleitores' })).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível abrir esta tela')).not.toBeInTheDocument();
  });

  it('edita um cadastro antigo malformado sem tela de erro', async () => {
    state.voters = [legacyVoter];
    const user = userEvent.setup();
    await renderLeader();

    await user.click(screen.getByRole('button', { name: /Eleitor sem nome/i }));
    await user.click(await screen.findByRole('button', { name: 'Editar' }));

    expect(await screen.findByRole('heading', { name: /Eleitor sem nome/i })).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível abrir esta tela')).not.toBeInTheDocument();
  });
});
