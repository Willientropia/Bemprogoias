export function validatedVoters(leader) {
  return Math.max(0, Number(leader?.eleitoresValidados) || 0);
}

// Rating relativo da campanha: o maior total validado recebe 5,0; o menor,
// 1,0; os demais são interpolados na mesma escala. Empates recebem a mesma nota.
export function rating(validated, minimum, maximum) {
  const value = Math.max(0, Number(validated) || 0);
  const min = Math.max(0, Number(minimum) || 0);
  const max = Math.max(min, Number(maximum) || 0);
  if (max === min) return max > 0 ? 5 : 1;
  const normalized = 1 + (4 * (value - min)) / (max - min);
  return Math.max(1, Math.min(5, Math.round(normalized * 10) / 10));
}

export function ratingRange(leaders) {
  const values = leaders.map(validatedVoters);
  return {
    minimum: values.length ? Math.min(...values) : 0,
    maximum: values.length ? Math.max(...values) : 0,
  };
}

export function leaderRating(leader, leaders) {
  const { minimum, maximum } = ratingRange(leaders);
  return rating(validatedVoters(leader), minimum, maximum);
}

export function formatNumber(n) {
  return n.toLocaleString("pt-BR");
}

export function sortLeaders(leaders, mode) {
  const arr = [...leaders];
  if (mode === "rating") {
    return arr.sort((a, b) => (
      leaderRating(b, leaders) - leaderRating(a, leaders)
      || validatedVoters(b) - validatedVoters(a)
    ));
  }
  if (mode === "crescimento") {
    return arr.sort((a, b) => b.semana - a.semana);
  }
  return arr.sort((a, b) => validatedVoters(b) - validatedVoters(a));
}

// Faixas proporcionais à base demonstrativa de no máximo 300 eleitores.
export function weeklyColor(semana) {
  if (semana >= 5) return "#1f6b34";
  if (semana >= 2) return "#b8860b";
  return "#c0392b";
}
