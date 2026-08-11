import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VotersTab from "../../src/pages/manager/panel/VotersTab";
import { fetchVoterStats, fetchVotersPage } from "../../src/services/voters";

vi.mock("../../src/services/voters", () => ({
  fetchVoterStats: vi.fn(),
  fetchVotersPage: vi.fn(),
}));

const leaders = [
  { id: "leader-a", nome: "Ana", bairro: "Centro", eleitores: 44, eleitoresValidados: 40, semana: 8 },
  { id: "leader-b", nome: "Bruno", bairro: "Bueno", eleitores: 18, eleitoresValidados: 15, semana: 3 },
];

const voter = {
  id: "v1",
  name: "Maria Silva",
  rg: "123456789",
  titulo: "999999999999",
  whatsapp: "(62) 9 1000-0000",
  leaderId: "leader-a",
  bairro: "Setor Central",
  regiao: "Região Central",
  createdAt: { toDate: () => new Date("2026-08-11T12:00:00") },
  locationModeLabel: "GPS do celular",
  source: "Visita em campo",
  validationStatus: "validado",
  validationReason: "Documento sem duplicidade e contato confirmado",
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchVoterStats.mockResolvedValue({ total: 300, week: 41, validated: 273, validationRate: 91 });
  fetchVotersPage.mockResolvedValue({ voters: [voter], cursor: null, hasMore: false });
});

describe("VotersTab", () => {
  it("exibe volume, evidência e vínculo com o líder", async () => {
    render(<VotersTab campaignId="campaign-demo" leaders={leaders} />);

    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText(/VALIDADOS · 91%/)).toBeInTheDocument();
    expect(screen.getAllByText("Ana").length).toBeGreaterThan(0);
    expect(screen.getByText("Visita em campo")).toBeInTheDocument();
    expect(screen.getByText("Documento sem duplicidade e contato confirmado")).toBeInTheDocument();
    expect(screen.getByText(/Só o status/)).toBeInTheDocument();
  });

  it("consulta novamente ao filtrar por líder", async () => {
    const user = userEvent.setup();
    render(<VotersTab campaignId="campaign-demo" leaders={leaders} />);
    await screen.findByText("Maria Silva");

    await user.selectOptions(screen.getByLabelText("Líder responsável"), "leader-b");

    await waitFor(() => expect(fetchVotersPage).toHaveBeenLastCalledWith(expect.objectContaining({
      campaignId: "campaign-demo",
      leaderId: "leader-b",
      validationStatus: "todos",
    })));
  });
});
