import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../../src/pages/auth/LoginPage";
import { useAuth } from "../../src/contexts/AuthContext";

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const login = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ login });
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

async function submitWith(user, { email = "a@b.com", password = "123456" } = {}) {
  await user.type(screen.getByLabelText(/e-mail/i), email);
  await user.type(screen.getByLabelText(/senha/i), password);
  await user.click(screen.getByRole("button", { name: /entrar/i }));
}

describe("LoginPage — mensagens de erro", () => {
  it("mostra mensagem quando a senha está errada", async () => {
    login.mockRejectedValue({ code: "auth/wrong-password" });
    const user = userEvent.setup();
    renderLogin();

    await submitWith(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(/senha incorreta/i);
  });

  it("mostra mensagem quando o usuário não existe", async () => {
    login.mockRejectedValue({ code: "auth/user-not-found" });
    const user = userEvent.setup();
    renderLogin();

    await submitWith(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(/não encontrado/i);
  });

  it("mostra mensagem para credencial inválida (proteção de enumeração)", async () => {
    login.mockRejectedValue({ code: "auth/invalid-credential" });
    const user = userEvent.setup();
    renderLogin();

    await submitWith(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(/e-mail ou senha/i);
  });

  it("mostra mensagem específica quando há muitas tentativas", async () => {
    login.mockRejectedValue({ code: "auth/too-many-requests" });
    const user = userEvent.setup();
    renderLogin();

    await submitWith(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(/tentativas/i);
  });

  it("mostra mensagem de falha de conexão", async () => {
    login.mockRejectedValue({ code: "auth/network-request-failed" });
    const user = userEvent.setup();
    renderLogin();

    await submitWith(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(/conex/i);
  });

  it("mantém a mensagem de erro visível após a falha", async () => {
    login.mockRejectedValue({ code: "auth/invalid-credential" });
    const user = userEvent.setup();
    renderLogin();

    await submitWith(user);
    const alert = await screen.findByRole("alert");

    // A mensagem não pode sumir sozinha depois de renderizada.
    await new Promise((r) => setTimeout(r, 150));
    expect(alert).toBeInTheDocument();
  });

  it("limpa o erro anterior ao tentar novamente", async () => {
    login.mockRejectedValue({ code: "auth/invalid-credential" });
    const user = userEvent.setup();
    renderLogin();

    await submitWith(user);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    login.mockResolvedValue({});
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
