import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ManagerDashboard from "../../src/pages/manager/ManagerDashboard";
import { useAuth } from "../../src/contexts/AuthContext";
import { subscribeToCampaign } from "../../src/services/campaigns";
import { subscribeToLeaders } from "../../src/services/leaders";

vi.mock("../../src/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../src/services/campaigns", () => ({ subscribeToCampaign: vi.fn() }));
vi.mock("../../src/services/leaders", () => ({
  subscribeToLeaders: vi.fn(),
  updateLeader: vi.fn(),
  deleteLeader: vi.fn(),
}));
vi.mock("../../src/pages/manager/panel/RegionsTab", () => ({
  default: ({ leaders }) => <div>Mapa vindo do banco: {leaders.map((leader) => leader.nome).join(", ")}</div>,
}));
vi.mock("../../src/pages/manager/panel/NetworkTab", () => ({
  default: ({ leaders }) => <div>Rede com {leaders.length} líder</div>,
}));
vi.mock("../../src/pages/manager/panel/ReportTab", () => ({
  default: ({ leaders }) => <div>Relatório com {leaders.length} líder</div>,
}));
vi.mock("../../src/pages/manager/panel/VotersTab", () => ({
  default: ({ leaders }) => <div>Eleitores de {leaders.length} líder</div>,
}));

const persistedLeader = {
  id: "demo-l1",
  name: "Ana Ribeiro",
  role: "leader",
  regiao: "Região Central",
  bairro: "Setor Central",
  lat: -16.6799,
  lng: -49.255,
  eleitores: 2140,
  semana: 86,
  perf: "alto",
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  useAuth.mockReturnValue({
    user: { email: "gestor@demo.local" },
    role: "manager",
    campaignId: "campaign-demo",
    logout: vi.fn(),
  });
  subscribeToCampaign.mockImplementation((_campaignId, onChange) => {
    onChange({ id: "campaign-demo", name: "Campanha Demo", isDemo: true });
    return vi.fn();
  });
  subscribeToLeaders.mockImplementation((_campaignId, onChange) => {
    onChange([persistedLeader, { id: "sem-metricas", name: "Líder incompleto", role: "leader" }]);
    return vi.fn();
  });
});

describe("ManagerDashboard", () => {
  it("alimenta o painel somente com líderes persistidos e completos", async () => {
    render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);

    expect(await screen.findByText("Mapa vindo do banco: Ana Ribeiro")).toBeInTheDocument();
    expect(subscribeToCampaign).toHaveBeenCalledWith("campaign-demo", expect.any(Function), expect.any(Function));
    expect(subscribeToLeaders).toHaveBeenCalledWith("campaign-demo", expect.any(Function), expect.any(Function));
    expect(screen.getByText(/Campanha de demonstração/)).toBeInTheDocument();
  });

  it("troca as seções pela navegação lateral", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);

    await user.click(screen.getByRole("button", { name: "Rede de Indicações" }));
    expect(screen.getByText("Rede com 1 líder")).toBeVisible();
    expect(screen.getByText("Mapa vindo do banco: Ana Ribeiro").closest("section")).toHaveAttribute("hidden");
  });
});
