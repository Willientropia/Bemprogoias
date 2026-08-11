import { describe, it, expect } from "vitest";
import { buildReportMessage } from "../../src/pages/manager/panel/buildReportMessage";

const leaders = [
  { id: "a", nome: "Ana", bairro: "Centro", eleitores: 2000, semana: 80, perf: "alto" },
  { id: "b", nome: "Bruno", bairro: "Sul", eleitores: 900, semana: 10, perf: "alerta" },
  { id: "c", nome: "Carla", bairro: "Norte", eleitores: 600, semana: 5, perf: "alerta" },
];

const allBlocks = [
  { id: "resumo", ativo: true },
  { id: "ranking", ativo: true },
  { id: "alerta", ativo: true },
  { id: "demandas", ativo: true },
  { id: "sentimento", ativo: true },
  { id: "presenca", ativo: true },
];

const noBlocks = allBlocks.map((b) => ({ ...b, ativo: false }));

const base = { leaders, frequencia: "Diário (fim do dia)", horario: "21:00" };

describe("buildReportMessage", () => {
  it("sempre inclui cabeçalho, frequência/horário e rodapé", () => {
    const msg = buildReportMessage({ ...base, blocks: noBlocks });
    expect(msg).toContain("*BEM PARA GOIÁS — Relatório Expresso*");
    expect(msg).toContain("_Diário (fim do dia) · 21:00 · Goiânia_");
    expect(msg).toContain("Painel completo:");
  });

  it("omite blocos desligados", () => {
    const msg = buildReportMessage({ ...base, blocks: noBlocks });
    expect(msg).not.toContain("Eleitores indicados hoje");
    expect(msg).not.toContain("Top líderes do dia");
    expect(msg).not.toContain("Bases em alerta");
  });

  it("soma os eleitores da semana no bloco de resumo", () => {
    const msg = buildReportMessage({
      ...base,
      blocks: [{ id: "resumo", ativo: true }],
    });
    expect(msg).toContain("*Eleitores indicados hoje:* 95");
    expect(msg).toContain("Base total: 3.500 eleitores");
  });

  it("lista os líderes por crescimento no ranking", () => {
    const msg = buildReportMessage({
      ...base,
      blocks: [{ id: "ranking", ativo: true }],
    });
    expect(msg).toContain("1. Ana — +80");
    expect(msg).toContain("2. Bruno — +10");
    expect(msg).toContain("3. Carla — +5");
  });

  it("lista apenas as bases em alerta", () => {
    const msg = buildReportMessage({
      ...base,
      blocks: [{ id: "alerta", ativo: true }],
    });
    expect(msg).toContain("*Bases em alerta:* 2");
    expect(msg).toContain("• Bruno (Sul) — +10");
    expect(msg).toContain("• Carla (Norte) — +5");
    expect(msg).not.toContain("• Ana");
  });

  it("reflete a frequência e o horário escolhidos", () => {
    const msg = buildReportMessage({
      ...base,
      frequencia: "Semanal",
      horario: "08:30",
      blocks: noBlocks,
    });
    expect(msg).toContain("_Semanal · 08:30 · Goiânia_");
  });

  it("inclui todos os blocos quando todos estão ligados", () => {
    const msg = buildReportMessage({ ...base, blocks: allBlocks });
    expect(msg).toContain("Eleitores indicados hoje");
    expect(msg).toContain("Top líderes do dia");
    expect(msg).toContain("Bases em alerta");
    expect(msg).toContain("Demandas abertas hoje");
    expect(msg).toContain("Rádio Peão IA");
    expect(msg).toContain("Presença nos conselhos");
  });
});
