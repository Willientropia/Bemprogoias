import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ReportTab from "../../src/pages/manager/panel/ReportTab";
import { filterLeadersByScope } from "../../src/pages/manager/panel/reportScope";

const leaders = [
  { id: "a", nome: "Ana", bairro: "Centro", regiao: "Região Central", eleitores: 100, semana: 10, perf: "alto" },
  { id: "b", nome: "Bruno", bairro: "Norte", regiao: "Região Norte", eleitores: 300, semana: 5, perf: "alerta" },
  { id: "c", nome: "Carla", bairro: "Sul", regiao: "Região Sul", eleitores: 200, semana: 8, perf: "medio" },
];

describe("filterLeadersByScope", () => {
  it("mantém todos os líderes no escopo padrão", () => {
    expect(filterLeadersByScope(leaders, "todos")).toBe(leaders);
  });

  it("filtra somente a Região Central", () => {
    expect(filterLeadersByScope(leaders, "central").map((leader) => leader.id)).toEqual(["a"]);
  });

  it("filtra somente bases em alerta", () => {
    expect(filterLeadersByScope(leaders, "alerta").map((leader) => leader.id)).toEqual(["b"]);
  });

  it("ordena o top 20 por eleitores sem modificar a lista original", () => {
    const original = [...leaders];
    expect(filterLeadersByScope(leaders, "top20").map((leader) => leader.id)).toEqual(["b", "c", "a"]);
    expect(leaders).toEqual(original);
  });

  it("atualiza a prévia ao trocar o escopo na interface", async () => {
    const user = userEvent.setup();
    render(<ReportTab leaders={leaders} />);

    expect(screen.getByText(/Base total: 600 eleitores/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Escopo do relatório"), "central");

    expect(screen.getByText(/Base total: 100 eleitores/)).toBeInTheDocument();
    expect(screen.queryByText(/Bruno — \+5/)).not.toBeInTheDocument();
  });
});
