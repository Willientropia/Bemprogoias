import { lazy, Suspense } from "react";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ROLES } from "./config/roles";
import LoginPage from "./pages/auth/LoginPage";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import CampaignDetailPage from "./pages/super-admin/CampaignDetailPage";
import ManagerDashboard from "./pages/manager/ManagerDashboard";

const LeaderApp = lazy(() => import("./pages/leader/LeaderApp"));

function RoleHome() {
  const { role, loading } = useAuth();

  if (loading) return <p className="app-route-loading">Conectando ao Firebase…</p>;

  if (role === ROLES.SUPER_ADMIN) return <Navigate to="/super-admin" replace />;
  if (role === ROLES.MANAGER) return <Navigate to="/manager" replace />;
  if (role === ROLES.LEADER) return <Navigate to="/leader" replace />;
  return <Navigate to="/login" replace />;
}

// No Electron a interface é carregada de um arquivo local (file://), e o
// BrowserRouter dependeria do servidor responder qualquer rota com o index.
// O HashRouter guarda a rota depois do "#", que funciona sem servidor —
// mas só é usado no desktop, para as URLs do site continuarem limpas.
const Router = window.electronAPI?.isElectron ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/campaigns/:campaignId"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <CampaignDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader"
            element={
              <ProtectedRoute allowedRoles={[ROLES.LEADER]}>
                <Suspense fallback={<p>Carregando aplicativo de campo…</p>}>
                  <LeaderApp />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<RoleHome />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
