import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LeaderForm from "../../src/pages/manager/LeaderForm";
import { createLeader } from "../../src/services/userProvisioning";

vi.mock("../../src/services/userProvisioning", () => ({ createLeader: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe("LeaderForm", () => {
  it("salva localização e métricas necessárias para o líder entrar no mapa", async () => {
    createLeader.mockResolvedValue("leader-id");
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<LeaderForm campaignId="campaign-demo" onCreated={onCreated} />);

    await user.type(screen.getByLabelText("Nome completo"), "Novo Líder");
    await user.type(screen.getByLabelText("E-mail (login)"), "novo@demo.local");
    await user.type(screen.getByLabelText("Senha inicial"), "123456");
    await user.type(screen.getByLabelText("WhatsApp"), "(62) 9 9999-1111");
    await user.selectOptions(screen.getByLabelText("Ponto de atuação no mapa"), "setor-bueno");
    await user.click(screen.getByRole("button", { name: "Criar líder" }));

    expect(createLeader).toHaveBeenCalledWith({
      name: "Novo Líder",
      email: "novo@demo.local",
      password: "123456",
      whatsapp: "(62) 9 9999-1111",
      campaignId: "campaign-demo",
      regiao: "Região Sul",
      bairro: "Setor Bueno",
      lat: -16.705,
      lng: -49.279,
      raioKm: 5,
    });
    expect(onCreated).toHaveBeenCalled();
  });

  it("exige um ponto de atuação", async () => {
    const user = userEvent.setup();
    render(<LeaderForm campaignId="campaign-demo" />);

    await user.type(screen.getByLabelText("Nome completo"), "Novo Líder");
    await user.type(screen.getByLabelText("E-mail (login)"), "novo@demo.local");
    await user.type(screen.getByLabelText("Senha inicial"), "123456");
    await user.type(screen.getByLabelText("WhatsApp"), "(62) 9 9999-1111");
    await user.click(screen.getByRole("button", { name: "Criar líder" }));

    expect(createLeader).not.toHaveBeenCalled();
  });
});
