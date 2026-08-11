// Regra de rating do handoff: um décimo de estrela a cada 50 eleitores,
// limitado entre 1,0 e 5,0.
export function rating(eleitores) {
  return Math.max(1, Math.min(5, Math.round((eleitores / 500) * 10) / 10));
}

export function formatNumber(n) {
  return n.toLocaleString("pt-BR");
}

export function sortLeaders(leaders, mode) {
  const arr = [...leaders];
  if (mode === "rating") {
    return arr.sort((a, b) => rating(b.eleitores) - rating(a.eleitores) || b.eleitores - a.eleitores);
  }
  if (mode === "crescimento") {
    return arr.sort((a, b) => b.semana - a.semana);
  }
  return arr.sort((a, b) => b.eleitores - a.eleitores);
}

// Cor do "+N na semana" por faixa (handoff: >=30 verde, 15-29 âmbar, <15 vermelho).
export function weeklyColor(semana) {
  if (semana >= 30) return "#1f6b34";
  if (semana >= 15) return "#b8860b";
  return "#c0392b";
}
