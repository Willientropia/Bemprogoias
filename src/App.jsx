import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ROLES } from "./config/roles";
import LoginPage from "./pages/auth/LoginPage";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import ManagerDashboard from "./pages/manager/ManagerDashboard";

function RoleHome() {
  const { role } = useAuth();

  if (role === ROLES.SUPER_ADMIN) return <Navigate to="/super-admin" replace />;
  if (role === ROLES.MANAGER) return <Navigate to="/manager" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
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
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<RoleHome />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
