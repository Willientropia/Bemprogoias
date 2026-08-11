export const REPORT_SCOPES = [
  { id: "todos", label: "Todos os líderes de Goiânia" },
  { id: "central", label: "Somente Região Central" },
  { id: "alerta", label: "Somente bases em alerta" },
  { id: "top20", label: "Top 20 líderes" },
];

export function filterLeadersByScope(leaders, scopeId) {
  if (scopeId === "central") {
    return leaders.filter((leader) => leader.regiao === "Região Central");
  }

  if (scopeId === "alerta") {
    return leaders.filter((leader) => leader.perf === "alerta");
  }

  if (scopeId === "top20") {
    return [...leaders].sort((a, b) => b.eleitores - a.eleitores).slice(0, 20);
  }

  return leaders;
}
