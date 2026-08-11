import { describe, it, expect } from "vitest";
import { rating, sortLeaders, weeklyColor, formatNumber } from "../../src/pages/manager/panel/leaderMetrics";

const leaders = [
  { id: "a", nome: "A", eleitores: 1000, semana: 10 },
  { id: "b", nome: "B", eleitores: 2500, semana: 50 },
  { id: "c", nome: "C", eleitores: 500, semana: 30 },
];

describe("rating", () => {
  it("dá um décimo de estrela a cada 50 eleitores", () => {
    expect(rating(500)).toBe(1);
    expect(rating(1000)).toBe(2);
    expect(rating(2500)).toBe(5);
  });

  it("nunca fica abaixo de 1", () => {
    expect(rating(0)).toBe(1);
    expect(rating(100)).toBe(1);
  });

  it("nunca passa de 5", () => {
    expect(rating(10000)).toBe(5);
  });
});

describe("sortLeaders", () => {
  it("ordena por eleitores por padrão", () => {
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
  it("usa verde a partir de 30", () => {
    expect(weeklyColor(30)).toBe("#1f6b34");
    expect(weeklyColor(80)).toBe("#1f6b34");
  });

  it("usa âmbar entre 15 e 29", () => {
    expect(weeklyColor(15)).toBe("#b8860b");
    expect(weeklyColor(29)).toBe("#b8860b");
  });

  it("usa vermelho abaixo de 15", () => {
    expect(weeklyColor(14)).toBe("#c0392b");
    expect(weeklyColor(0)).toBe("#c0392b");
  });
});

describe("formatNumber", () => {
  it("formata em pt-BR com separador de milhar", () => {
    expect(formatNumber(2140)).toBe("2.140");
    expect(formatNumber(38400)).toBe("38.400");
  });
});
