import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReportTab from "../../src/pages/manager/panel/ReportTab";
import { updateReportSettings } from "../../src/services/campaigns";

vi.mock("../../src/services/campaigns", () => ({ updateReportSettings: vi.fn() }));

const leaders = [
  { id: "a", nome: "Ana", bairro: "Centro", eleitores: 100, eleitoresValidados: 90, hoje: 4, semana: 10, perf: "alto" },
  { id: "b", nome: "Bruno", bairro: "Norte", eleitores: 300, eleitoresValidados: 270, hoje: 2, semana: 5, perf: "alerta" },
  { id: "c", nome: "Carla", bairro: "Sul", eleitores: 200, eleitoresValidados: 180, hoje: 3, semana: 8, perf: "medio" },
];

const campaign = {
  id: "campaign-demo",
  reportRecipientWhatsapp: "(62) 9 9999-0000",
  reportDeliveryTime: "21:00",
};

beforeEach(() => {
  vi.clearAllMocks();
  updateReportSettings.mockResolvedValue();
});

describe("ReportTab — relatório do gestor", () => {
  it("sempre inclui todos os líderes no relatório diário do gestor", () => {
    render(<ReportTab leaders={leaders} campaignId="campaign-demo" campaign={campaign} />);

    expect(screen.getByText(/Todos os líderes — produção do dia \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Ana — \+4 hoje/)).toBeInTheDocument();
    expect(screen.getByText(/Bruno — \+2 hoje/)).toBeInTheDocument();
    expect(screen.getByText(/Carla — \+3 hoje/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Escopo do relatório")).not.toBeInTheDocument();
  });

  it("salva o WhatsApp e o horário definidos pelo gestor", async () => {
    const user = userEvent.setup();
    render(<ReportTab leaders={leaders} campaignId="campaign-demo" campaign={campaign} />);

    const phone = screen.getByLabelText("WhatsApp do gestor");
    await user.clear(phone);
    await user.type(phone, "(62) 9 8888-7777");
    await user.clear(screen.getByLabelText("Horário do disparo"));
    await user.type(screen.getByLabelText("Horário do disparo"), "20:30");
    await user.click(screen.getByRole("button", { name: "Salvar destinatário" }));

    await waitFor(() => expect(updateReportSettings).toHaveBeenCalledWith("campaign-demo", {
      whatsapp: "(62) 9 8888-7777",
      deliveryTime: "20:30",
    }));
  });

  it("abre a prévia diretamente no WhatsApp configurado", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<ReportTab leaders={leaders} campaignId="campaign-demo" campaign={campaign} />);

    await user.click(screen.getByRole("button", { name: "Abrir teste no WhatsApp" }));

    expect(open).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/wa\.me\/5562999990000\?text=/),
      "_blank",
      "noopener,noreferrer"
    );
    open.mockRestore();
  });
});
