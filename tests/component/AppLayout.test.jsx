import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppLayout } from "../../src/components/AppLayout";
import { useAuth } from "../../src/contexts/AuthContext";

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const items = [
  { id: "regioes", label: "Regiões", icon: "map" },
  { id: "rede", label: "Rede de Indicações", icon: "network" },
];

beforeEach(() => {
  window.localStorage.clear();
  useAuth.mockReturnValue({
    user: { email: "gestor@demo.local" },
    role: "manager",
    logout: vi.fn(),
  });
});

function renderLayout(onItemChange = vi.fn()) {
  return {
    onItemChange,
    ...render(
      <MemoryRouter>
        <AppLayout
          sidebarItems={items}
          activeSidebarItem="regioes"
          onSidebarItemChange={onItemChange}
          sidebarContextLabel="PAINEL DO GESTOR"
        >
          <div>Conteúdo</div>
        </AppLayout>
      </MemoryRouter>
    ),
  };
}

describe("AppLayout", () => {
  it("usa as seções do gestor como navegação lateral", async () => {
    const user = userEvent.setup();
    const { onItemChange } = renderLayout();

    expect(screen.getByRole("button", { name: "Regiões" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Rede de Indicações" }));

    expect(onItemChange).toHaveBeenCalledWith("rede");
  });

  it("recolhe e expande a barra lateral, preservando a preferência", async () => {
    const user = userEvent.setup();
    const { container } = renderLayout();

    await user.click(screen.getByRole("button", { name: "Recolher barra lateral" }));
    expect(container.querySelector(".app-shell")).toHaveClass("sidebar-is-collapsed");
    expect(window.localStorage.getItem("bemparagoias.sidebarCollapsed")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Expandir barra lateral" }));
    expect(container.querySelector(".app-shell")).not.toHaveClass("sidebar-is-collapsed");
  });

  it("abre e fecha o menu móvel sem trocar de rota", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByLabelText("Navegação principal")).toHaveClass("mobile-open");
    expect(screen.getAllByRole("button", { name: "Fechar menu" })).toHaveLength(2);

    await user.click(screen.getAllByRole("button", { name: "Fechar menu" })[0]);
    expect(screen.getByLabelText("Navegação principal")).not.toHaveClass("mobile-open");
  });
});
