import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CampaignForm from "../../src/pages/super-admin/CampaignForm";
import { createCampaign, updateCampaign } from "../../src/services/campaigns";

vi.mock("../../src/services/campaigns", () => ({
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CampaignForm", () => {
  it("cria uma nova campanha com os dados preenchidos", async () => {
    createCampaign.mockResolvedValue({ id: "new-id" });
    const onDone = vi.fn();
    const user = userEvent.setup();

    render(<CampaignForm editingCampaign={null} onDone={onDone} />);

    await user.type(screen.getByPlaceholderText("Nome da campanha"), "Campanha Teste");
    await user.click(screen.getByRole("button", { name: /criar campanha/i }));

    expect(createCampaign).toHaveBeenCalledWith({ name: "Campanha Teste", minAppVersion: "" });
    expect(onDone).toHaveBeenCalled();
  });

  it("preenche o formulário com os dados da campanha ao editar", () => {
    render(
      <CampaignForm
        editingCampaign={{ id: "c1", name: "Campanha X", minAppVersion: "1.2.0" }}
        onDone={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue("Campanha X")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1.2.0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvar alterações/i })).toBeInTheDocument();
  });

  it("chama updateCampaign (não createCampaign) ao salvar edição", async () => {
    updateCampaign.mockResolvedValue();
    const onDone = vi.fn();
    const user = userEvent.setup();

    render(
      <CampaignForm
        editingCampaign={{ id: "c1", name: "Campanha X", minAppVersion: "" }}
        onDone={onDone}
      />
    );

    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    expect(updateCampaign).toHaveBeenCalledWith("c1", { name: "Campanha X", minAppVersion: "" });
    expect(createCampaign).not.toHaveBeenCalled();
  });

  it("mostra mensagem de erro quando o salvamento falha", async () => {
    createCampaign.mockRejectedValue(new Error("permission-denied"));
    const user = userEvent.setup();

    render(<CampaignForm editingCampaign={null} onDone={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("Nome da campanha"), "Campanha Teste");
    await user.click(screen.getByRole("button", { name: /criar campanha/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível salvar a campanha.");
  });

  it("não permite submeter sem preencher o nome (campo obrigatório)", async () => {
    const user = userEvent.setup();
    render(<CampaignForm editingCampaign={null} onDone={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /criar campanha/i }));

    expect(createCampaign).not.toHaveBeenCalled();
  });
});
