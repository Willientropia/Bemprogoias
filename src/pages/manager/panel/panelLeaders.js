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
    .map((leader) => ({
      ...leader,
      nome: leader.name ?? leader.nome,
      eleitoresValidados: Number.isFinite(leader.eleitoresValidados) ? leader.eleitoresValidados : 0,
      hoje: Number.isFinite(leader.hoje) ? leader.hoje : 0,
    }));
}

export function spreadLeaderPositions(leaders, radius = 0.0018) {
  const groups = new Map();
  const positions = new Map();

  leaders.forEach((leader) => {
    const key = `${leader.lat.toFixed(5)}:${leader.lng.toFixed(5)}`;
    const group = groups.get(key) ?? [];
    group.push(leader);
    groups.set(key, group);
  });

  groups.forEach((group) => {
    if (group.length === 1) {
      positions.set(group[0].id, [group[0].lat, group[0].lng]);
      return;
    }

    group.forEach((leader, index) => {
      const angle = (Math.PI * 2 * index) / group.length;
      positions.set(leader.id, [
        leader.lat + Math.cos(angle) * radius,
        leader.lng + Math.sin(angle) * radius,
      ]);
    });
  });

  return positions;
}
