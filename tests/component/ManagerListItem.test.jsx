import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManagerListItem from "../../src/pages/super-admin/ManagerListItem";
import { deleteManager, updateManager } from "../../src/services/managers";

vi.mock("../../src/services/managers", () => ({
  updateManager: vi.fn(),
  deleteManager: vi.fn(),
}));

const manager = { id: "m1", name: "Ana Gestora", email: "ana@example.com", whatsapp: "11999990000" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ManagerListItem", () => {
  it("mostra os dados do gestor", () => {
    render(<ManagerListItem campaignId="camp1" manager={manager} />);
    expect(screen.getByText("Ana Gestora")).toBeInTheDocument();
    expect(screen.getByText(/ana@example.com/)).toBeInTheDocument();
  });

  it("entra em modo edição e salva as alterações", async () => {
    updateManager.mockResolvedValue();
    const user = userEvent.setup();
    render(<ManagerListItem campaignId="camp1" manager={manager} />);

    await user.click(screen.getByRole("button", { name: /editar/i }));
    const nameInput = screen.getByDisplayValue("Ana Gestora");
    await user.clear(nameInput);
    await user.type(nameInput, "Ana Editada");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(updateManager).toHaveBeenCalledWith("camp1", "m1", {
      name: "Ana Editada",
      whatsapp: "11999990000",
    });
  });

  it("cancela a edição sem salvar", async () => {
    const user = userEvent.setup();
    render(<ManagerListItem campaignId="camp1" manager={manager} />);

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(updateManager).not.toHaveBeenCalled();
    expect(screen.getByText("Ana Gestora")).toBeInTheDocument();
  });

  it("pede confirmação antes de remover e não remove se o usuário cancelar", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<ManagerListItem campaignId="camp1" manager={manager} />);

    await user.click(screen.getByRole("button", { name: /remover/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteManager).not.toHaveBeenCalled();
  });

  it("remove o gestor quando a confirmação é aceita", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteManager.mockResolvedValue();
    const user = userEvent.setup();
    render(<ManagerListItem campaignId="camp1" manager={manager} />);

    await user.click(screen.getByRole("button", { name: /remover/i }));

    expect(deleteManager).toHaveBeenCalledWith("camp1", "m1");
  });
});
