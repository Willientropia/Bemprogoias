import { describe, it, expect } from "vitest";
import { leaderRating, rating, sortLeaders, weeklyColor, formatNumber } from "../../src/pages/manager/panel/leaderMetrics";

const leaders = [
  { id: "a", nome: "A", eleitores: 30, eleitoresValidados: 20, semana: 10 },
  { id: "b", nome: "B", eleitores: 50, eleitoresValidados: 40, semana: 50 },
  { id: "c", nome: "C", eleitores: 12, eleitoresValidados: 10, semana: 30 },
];

describe("rating", () => {
  it("normaliza entre o menor e o maior total validado", () => {
    expect(rating(10, 10, 40)).toBe(1);
    expect(rating(25, 10, 40)).toBe(3);
    expect(rating(40, 10, 40)).toBe(5);
  });

  it("dá a mesma nota a empates e usa somente eleitores validados", () => {
    expect(rating(12, 12, 12)).toBe(5);
    expect(leaderRating(leaders[0], leaders)).toBe(2.3);
  });

  it("mantém a escala entre 1 e 5", () => {
    expect(rating(0, 10, 40)).toBe(1);
    expect(rating(100, 10, 40)).toBe(5);
  });
});

describe("sortLeaders", () => {
  it("ordena pelos eleitores validados por padrão", () => {
    expect(sortLeaders(leaders, "eleitores").map((l) => l.id)).toEqual(["b", "a", "c"]);
  });

  it("ordena por crescimento na semana", () => {
    expect(sortLeaders(leaders, "crescimento").map((l) => l.id)).toEqual(["b", "c", "a"]);
  });

  it("ordena por rating, desempatando por eleitores", () => {
    expect(sortLeaders(leaders, "rating").map((l) => l.id)).toEqual(["b", "a", "c"]);
  });

  it("não modifica o array original", () => {
    const original = [...leaders];
    sortLeaders(leaders, "crescimento");
    expect(leaders).toEqual(original);
  });
});

describe("weeklyColor", () => {
  it("usa verde a partir de 5", () => {
    expect(weeklyColor(5)).toBe("#1f6b34");
    expect(weeklyColor(8)).toBe("#1f6b34");
  });

  it("usa âmbar entre 2 e 4", () => {
    expect(weeklyColor(2)).toBe("#b8860b");
    expect(weeklyColor(4)).toBe("#b8860b");
  });

  it("usa vermelho abaixo de 2", () => {
    expect(weeklyColor(1)).toBe("#c0392b");
    expect(weeklyColor(0)).toBe("#c0392b");
  });
});

describe("formatNumber", () => {
  it("formata em pt-BR com separador de milhar", () => {
    expect(formatNumber(2140)).toBe("2.140");
    expect(formatNumber(38400)).toBe("38.400");
  });
});
