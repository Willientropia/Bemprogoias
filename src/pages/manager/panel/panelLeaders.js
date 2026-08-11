const PERFORMANCE_LEVELS = new Set(["alto", "medio", "alerta"]);

export function hasPanelMetrics(leader) {
  return Boolean(
    leader
      && (leader.name || leader.nome)
      && leader.regiao
      && leader.bairro
      && Number.isFinite(leader.lat)
      && Number.isFinite(leader.lng)
      && Number.isFinite(leader.eleitores)
      && Number.isFinite(leader.semana)
      && PERFORMANCE_LEVELS.has(leader.perf)
  );
}

export function toPanelLeaders(leaders) {
  return leaders
    .filter(hasPanelMetrics)
    .map((leader) => ({ ...leader, nome: leader.name ?? leader.nome }));
}
