import { describe, expect, it } from "vitest";
import { allocateVoterCounts, buildDemoVoterRecords } from "../../scripts/demoVoterFactory";

const leaders = [
  { id: "a", name: "Ana", regiao: "Central", bairro: "Centro", lat: -16.68, lng: -49.25, eleitores: 2000, perf: "alto" },
  { id: "b", name: "Bruno", regiao: "Sul", bairro: "Bueno", lat: -16.7, lng: -49.28, eleitores: 1000, perf: "medio" },
  { id: "c", name: "Adiel", regiao: "Sul", bairro: "Bueno", lat: -16.705, lng: -49.279, eleitores: 0, perf: "alerta" },
];

describe("demoVoterFactory", () => {
  it("distribui exatamente o volume solicitado entre todos os líderes", () => {
    const counts = allocateVoterCounts(leaders, 300);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(300);
    expect(counts.every((count) => count > 0)).toBe(true);
    expect(Math.max(...counts)).toBeGreaterThan(Math.min(...counts) * 4);
  });

  it("gera documentos únicos, completos e vinculados aos líderes", () => {
    const { records, summaries } = buildDemoVoterRecords(leaders, 300, new Date("2026-08-11T15:00:00Z"));
    expect(records).toHaveLength(300);
    expect(new Set(records.map((record) => record.id)).size).toBe(300);
    expect(new Set(records.map((record) => record.rg)).size).toBe(300);
    expect(new Set(records.map((record) => record.name)).size).toBe(300);
    expect(Object.keys(summaries)).toEqual(["a", "b", "c"]);
    expect(Object.values(summaries).reduce((sum, summary) => sum + summary.eleitores, 0)).toBe(300);
    expect(Object.values(summaries).reduce((sum, summary) => sum + summary.eleitoresValidados, 0))
      .toBe(records.filter((record) => record.validationStatus === "validado").length);
    expect(Object.values(summaries).reduce((sum, summary) => sum + summary.hoje, 0))
      .toBe(records.filter((record) => (
        record.validationStatus === "validado"
        && record.createdAt.toDateString() === new Date("2026-08-11T15:00:00Z").toDateString()
      )).length);
    expect(records[0]).toEqual(expect.objectContaining({
      leaderId: "a",
      validationStatus: "validado",
      validationMethod: "documento_contato",
      validationReason: expect.any(String),
      validatedAt: expect.any(Date),
      syncStatus: "sincronizado",
      isDemo: true,
    }));
  });

  it("gera atividade recente coerente com o desempenho do líder", () => {
    const { summaries } = buildDemoVoterRecords(leaders, 1000, new Date("2026-08-11T15:00:00Z"));
    expect(summaries.a.semana / summaries.a.eleitores).toBeGreaterThan(summaries.b.semana / summaries.b.eleitores);
    expect(summaries.b.semana / summaries.b.eleitores).toBeGreaterThan(summaries.c.semana / summaries.c.eleitores);
  });
});
