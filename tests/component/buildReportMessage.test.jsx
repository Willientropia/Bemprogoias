import { describe, it, expect } from "vitest";
import { buildReportMessage } from "../../src/pages/manager/panel/buildReportMessage";

const leaders = [
  { id: "a", nome: "Ana", bairro: "Centro", eleitores: 20, eleitoresValidados: 18, hoje: 4, semana: 8, perf: "alto" },
  { id: "b", nome: "Bruno", bairro: "Sul", eleitores: 9, eleitoresValidados: 8, hoje: 1, semana: 3, perf: "alerta" },
  { id: "c", nome: "Carla", bairro: "Norte", eleitores: 6, eleitoresValidados: 5, hoje: 2, semana: 2, perf: "alerta" },
];

const allBlocks = [
  { id: "resumo", ativo: true },
  { id: "alerta", ativo: true },
  { id: "demandas", ativo: true },
  { id: "sentimento", ativo: true },
  { id: "presenca", ativo: true },
];

const noBlocks = allBlocks.map((b) => ({ ...b, ativo: false }));

const base = { leaders, horario: "21:00" };

describe("buildReportMessage", () => {
  it("sempre inclui cabeçalho, rotina diária, todos os líderes e rodapé", () => {
    const msg = buildReportMessage({ ...base, blocks: noBlocks });
    expect(msg).toContain("*BEM PRO GOIÁS — Relatório Expresso*");
    expect(msg).toContain("_Diário · 21:00 · Goiânia_");
    expect(msg).toContain("*Todos os líderes — produção do dia (3)*");
    expect(msg).toContain("Ana — +4 hoje");
    expect(msg).toContain("Bruno — +1 hoje");
    expect(msg).toContain("Carla — +2 hoje");
    expect(msg).toContain("Painel completo:");
  });

  it("omite blocos desligados", () => {
    const msg = buildReportMessage({ ...base, blocks: noBlocks });
    expect(msg).not.toContain("Eleitores validados hoje");
    expect(msg).not.toContain("Bases em alerta");
  });

  it("soma somente a produção validada do dia no bloco de resumo", () => {
    const msg = buildReportMessage({
      ...base,
      blocks: [{ id: "resumo", ativo: true }],
    });
    expect(msg).toContain("*Eleitores validados hoje:* 7");
    expect(msg).toContain("Base validada: 31 eleitores");
  });

  it("ordena todos os líderes pela produção do dia", () => {
    const msg = buildReportMessage({
      ...base,
      blocks: noBlocks,
    });
    expect(msg.indexOf("1. Ana — +4 hoje")).toBeLessThan(msg.indexOf("2. Carla — +2 hoje"));
    expect(msg.indexOf("2. Carla — +2 hoje")).toBeLessThan(msg.indexOf("3. Bruno — +1 hoje"));
  });

  it("lista apenas as bases em alerta", () => {
    const msg = buildReportMessage({
      ...base,
      blocks: [{ id: "alerta", ativo: true }],
    });
    expect(msg).toContain("*Bases em alerta:* 2");
    expect(msg).toContain("• Bruno (Sul) — +1 hoje");
    expect(msg).toContain("• Carla (Norte) — +2 hoje");
    expect(msg).not.toContain("• Ana");
  });

  it("reflete o horário escolhido e mantém a frequência diária", () => {
    const msg = buildReportMessage({
      ...base,
      horario: "08:30",
      blocks: noBlocks,
    });
    expect(msg).toContain("_Diário · 08:30 · Goiânia_");
  });

  it("inclui todos os blocos quando todos estão ligados", () => {
    const msg = buildReportMessage({ ...base, blocks: allBlocks });
    expect(msg).toContain("Eleitores validados hoje");
    expect(msg).toContain("Todos os líderes — produção do dia");
    expect(msg).toContain("Bases em alerta");
    expect(msg).toContain("Demandas abertas hoje");
    expect(msg).toContain("Rádio Peão IA");
    expect(msg).toContain("Presença nos conselhos");
  });
});
