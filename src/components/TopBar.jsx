import { useAuth } from "../contexts/AuthContext";

export function TopBar() {
  const { user, role, logout } = useAuth();

  return (
    <header>
      <span>{user?.email}</span>
      {role && <span> — {role}</span>}
      <button type="button" onClick={logout}>
        Sair
      </button>
    </header>
  );
}
