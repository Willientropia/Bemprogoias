import { useEffect, useMemo, useState } from 'react';
import { isFreshLeaderLocation, subscribeToLeaderLocations } from '../services/liveLocation';

/**
 * Posições que os líderes estão compartilhando agora.
 *
 * Duas decisões aqui:
 *
 * 1. **Um relógio próprio.** O Firestore só avisa quando um documento MUDA. Se
 *    o líder fecha o app, o último documento fica lá parado — e sem um tique
 *    local o mapa mostraria aquele ponto para sempre, como se ele ainda
 *    estivesse em campo. O intervalo reavalia o "está fresco?" mesmo sem
 *    novidade do servidor.
 *
 * 2. **A lista vem sempre**, com quem envelheceu marcado como não-fresco em vez
 *    de removido, para a tela poder dizer "visto há 5 min" em vez de sumir com
 *    a pessoa sem explicação.
 */
export function useLiveLeaderLocations(campaignId, { maxAgeMs = 90_000 } = {}) {
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!campaignId) {
      setLocations([]);
      return undefined;
    }
    setError(null);
    const unsubscribe = subscribeToLeaderLocations(
      campaignId,
      (items) => setLocations(items),
      (failure) => setError(failure),
    );
    return unsubscribe;
  }, [campaignId]);

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const comEstado = locations.map((item) => ({
      ...item,
      fresh: isFreshLeaderLocation(item, maxAgeMs),
    }));
    return {
      locations: comEstado,
      // Só quem tem coordenada válida vira marcador — documento de "parei de
      // compartilhar" não tem lat/lng.
      ativos: comEstado.filter(
        (item) => item.fresh && Number.isFinite(item.lat) && Number.isFinite(item.lng),
      ),
      error,
      atualizadoEm: agora,
    };
  }, [locations, maxAgeMs, error, agora]);
}
