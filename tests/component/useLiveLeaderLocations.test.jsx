import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiveLeaderLocations } from '../../src/hooks/useLiveLeaderLocations';
import { subscribeToLeaderLocations } from '../../src/services/liveLocation';

vi.mock('../../src/services/liveLocation', async () => {
  const real = await vi.importActual('../../src/services/liveLocation');
  return { ...real, subscribeToLeaderLocations: vi.fn() };
});

// Documento igual ao que o app Android grava em campo (capturado do Firestore).
function docReal({ idadeMs = 5_000, sharing = true, ...resto } = {}) {
  const quando = Date.now() - idadeMs;
  return {
    id: 'qsviRPdDb3Z3PRdjXvpi1mXjJqj1',
    campaignId: 'uCgyfCKBljjAu0RelrFy',
    leaderId: 'qsviRPdDb3Z3PRdjXvpi1mXjJqj1',
    lat: -16.6788383,
    lng: -49.2455138,
    accuracy: 28,
    heading: null,
    speed: 0,
    sharing,
    deviceTimestamp: new Date(quando).toISOString(),
    updatedAt: { toMillis: () => quando },
    ...resto,
  };
}

let emitir;

beforeEach(() => {
  vi.clearAllMocks();
  subscribeToLeaderLocations.mockImplementation((_campaignId, callback) => {
    emitir = callback;
    return () => {};
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLiveLeaderLocations', () => {
  it('marca como ativo o líder que está compartilhando agora', () => {
    const { result } = renderHook(() => useLiveLeaderLocations('uCgyfCKBljjAu0RelrFy'));

    act(() => emitir([docReal()]));

    expect(result.current.ativos).toHaveLength(1);
    expect(result.current.ativos[0].lat).toBe(-16.6788383);
  });

  it('ignora posição antiga demais (líder saiu de campo)', () => {
    const { result } = renderHook(() => useLiveLeaderLocations('uCgyfCKBljjAu0RelrFy'));

    act(() => emitir([docReal({ idadeMs: 120_000 })]));

    expect(result.current.ativos).toHaveLength(0);
    expect(result.current.locations).toHaveLength(1);
    expect(result.current.locations[0].fresh).toBe(false);
  });

  it('ignora quem parou de compartilhar mesmo com posição recente', () => {
    const { result } = renderHook(() => useLiveLeaderLocations('uCgyfCKBljjAu0RelrFy'));

    act(() => emitir([docReal({ sharing: false })]));

    expect(result.current.ativos).toHaveLength(0);
  });

  // Este é o caso que importa para o mapa: o documento é reescrito a cada
  // movimento e a nova coordenada precisa chegar sem recarregar a página.
  it('reflete a nova coordenada quando o líder se move', () => {
    const { result } = renderHook(() => useLiveLeaderLocations('uCgyfCKBljjAu0RelrFy'));

    act(() => emitir([docReal()]));
    expect(result.current.ativos[0].lng).toBe(-49.2455138);

    act(() => emitir([docReal({ lat: -16.68, lng: -49.25 })]));
    expect(result.current.ativos[0].lat).toBe(-16.68);
    expect(result.current.ativos[0].lng).toBe(-49.25);
  });

  it('não quebra quando o documento ainda não tem coordenada', () => {
    const { result } = renderHook(() => useLiveLeaderLocations('uCgyfCKBljjAu0RelrFy'));

    act(() => emitir([docReal({ lat: undefined, lng: undefined })]));

    expect(result.current.ativos).toHaveLength(0);
  });

  it('não assina nada sem campaignId', () => {
    renderHook(() => useLiveLeaderLocations(null));
    expect(subscribeToLeaderLocations).not.toHaveBeenCalled();
  });

  // Sem um relógio próprio o mapa mostraria para sempre a última posição de
  // quem fechou o app: o Firestore não avisa quando um documento "envelhece".
  it('deixa de considerar ativo quando o tempo passa, sem novo evento', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLiveLeaderLocations('uCgyfCKBljjAu0RelrFy'));

    act(() => emitir([docReal({ idadeMs: 80_000 })]));
    expect(result.current.ativos).toHaveLength(1);

    await act(async () => {
      vi.advanceTimersByTime(20_000);
    });

    expect(result.current.ativos).toHaveLength(0);
  });
});
