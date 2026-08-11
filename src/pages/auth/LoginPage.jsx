import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// O Firebase, com proteção de enumeração de e-mail ativa (padrão em projetos
// novos), responde `auth/invalid-credential` tanto para senha errada quanto
// para usuário inexistente — por isso essa mensagem é propositalmente genérica.
const ERROR_MESSAGES = {
  "auth/invalid-credential": "E-mail ou senha incorretos. Verifique os dados e tente novamente.",
  "auth/wrong-password": "Senha incorreta. Tente novamente.",
  "auth/user-not-found": "Usuário não encontrado. Verifique o e-mail digitado.",
  "auth/invalid-email": "E-mail inválido. Verifique o formato do endereço.",
  "auth/user-disabled": "Esta conta foi desativada. Fale com o administrador da campanha.",
  "auth/too-many-requests": "Muitas tentativas seguidas. Aguarde alguns minutos antes de tentar de novo.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet e tente novamente.",
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(ERROR_MESSAGES[err?.code] ?? "Não foi possível entrar. Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Painel de marca */}
      <div
        style={{
          width: "44%",
          background: "var(--brand-900)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px 56px",
          color: "#fff",
        }}
        className="login-brand"
      >
        <div style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(243,196,28,.16),transparent 70%)", top: -160, right: -160 }} />
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(39,122,61,.55),transparent 70%)", bottom: -150, left: -120 }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 52, height: 52, background: "#fff", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 5, flexShrink: 0 }}>
            <img src="/logo-mark.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 17, letterSpacing: 0.5, lineHeight: 1 }}>
              BEM PARA GOIÁS
            </div>
            <div style={{ fontSize: 8.5, letterSpacing: 1.6, color: "rgba(255,255,255,.6)", marginTop: 3 }}>
              MANDATO COM PARTICIPAÇÃO PÚBLICA
            </div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, letterSpacing: 2.5, color: "var(--gold)", fontWeight: 600, marginBottom: 18 }}>
            PAINEL DE CAMPANHA
          </div>
          <h1 style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 46, lineHeight: 1.08, marginBottom: 20, color: "#fff" }}>
            Sua voz constrói<br />o futuro de Goiás.
          </h1>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "rgba(255,255,255,.78)", maxWidth: 420 }}>
            Acompanhe líderes regionais, organize a rede em campo e visualize o alcance da campanha em tempo real.
          </p>
        </div>

        <div style={{ position: "relative", fontSize: 11, color: "rgba(255,255,255,.4)", letterSpacing: 0.5 }}>
          Todos os direitos reservados ® · Acesso exclusivo por convite
        </div>
      </div>

      {/* Formulário */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--page-bg)", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 392 }}>
          <h2 style={{ fontSize: 30, marginBottom: 6 }}>Entrar na plataforma</h2>
          <p style={{ fontSize: 14.5, marginBottom: 30 }}>Acesso restrito a gestores e administradores da campanha.</p>

          <form onSubmit={handleSubmit} style={{ background: "none", border: "none", padding: 0, margin: 0, maxWidth: "none" }}>
            <div>
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="login-password">Senha</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p role="alert" className="alert-box">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{ width: "100%", marginTop: 8, padding: 15, fontSize: 15 }}
            >
              {submitting ? "Entrando..." : "Entrar na plataforma"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
