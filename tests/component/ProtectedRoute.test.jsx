import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useAuth } from "../../src/contexts/AuthContext";

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

function renderWithAuth(authValue, allowedRoles) {
  useAuth.mockReturnValue(authValue);
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/login" element={<div>Tela de login</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Conteúdo protegido</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("não renderiza nada enquanto a sessão está carregando", () => {
    const { container } = renderWithAuth({ user: null, role: null, loading: true });
    expect(container).toBeEmptyDOMElement();
  });

  it("redireciona para /login quando não há usuário logado", () => {
    renderWithAuth({ user: null, role: null, loading: false });
    expect(screen.getByText("Tela de login")).toBeInTheDocument();
  });

  it("redireciona para /login quando o papel não está na lista permitida", () => {
    renderWithAuth(
      { user: { uid: "leader-1" }, role: "leader", loading: false },
      ["super_admin", "manager"]
    );
    expect(screen.getByText("Tela de login")).toBeInTheDocument();
  });

  it("renderiza o conteúdo quando o papel é permitido", () => {
    renderWithAuth(
      { user: { uid: "admin-1" }, role: "super_admin", loading: false },
      ["super_admin"]
    );
    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });

  it("renderiza o conteúdo quando nenhuma restrição de papel é passada", () => {
    renderWithAuth({ user: { uid: "any-1" }, role: "leader", loading: false }, undefined);
    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });
});
