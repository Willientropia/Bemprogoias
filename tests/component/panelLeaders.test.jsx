import { describe, expect, it } from "vitest";
import { hasPanelMetrics, toPanelLeaders } from "../../src/pages/manager/panel/panelLeaders";

const completeLeader = {
  id: "demo-l1",
  name: "Ana Ribeiro",
  regiao: "Região Central",
  bairro: "Setor Central",
  lat: -16.6799,
  lng: -49.255,
  eleitores: 2140,
  semana: 86,
  perf: "alto",
};

describe("panelLeaders", () => {
  it("aceita um líder persistido com todas as métricas do painel", () => {
    expect(hasPanelMetrics(completeLeader)).toBe(true);
  });

  it("não envia ao mapa líderes ainda sem coordenadas ou métricas", () => {
    expect(hasPanelMetrics({ id: "real-1", name: "Líder sem geolocalização", role: "leader" })).toBe(false);
  });

  it("adapta name do Firestore para a propriedade nome usada pelas telas", () => {
    expect(toPanelLeaders([completeLeader])).toEqual([
      expect.objectContaining({ id: "demo-l1", nome: "Ana Ribeiro" }),
    ]);
  });

  it("mantém apenas líderes completos sem alterar a coleção recebida", () => {
    const leaders = [completeLeader, { id: "incompleto", name: "Incompleto" }];
    expect(toPanelLeaders(leaders).map((leader) => leader.id)).toEqual(["demo-l1"]);
    expect(leaders[0]).not.toHaveProperty("nome");
  });
});
