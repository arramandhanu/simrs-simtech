import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import AuthCallback from "./pages/auth/AuthCallback";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import UsersPage from "./pages/Users";
import SettingsPage from "./pages/Settings";
import QueueOperator from "./pages/QueueOperator";
import QueueDisplay from "./pages/QueueDisplay";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";
import { AppearanceProvider } from "./context/AppearanceContext";

function App() {
  return (
    <AppearanceProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Standalone fullscreen display (no sidebar, no auth) */}
          <Route path="/antrian/display" element={<QueueDisplay />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dokter" element={<Doctors />} />
              <Route
                path="paramedis"
                element={
                  <div className="p-8">Paramedis Page (Coming Soon)</div>
                }
              />
              <Route
                path="pasien"
                element={<div className="p-8">Pasien Page (Coming Soon)</div>}
              />
              <Route
                path="igd"
                element={<div className="p-8">IGD Page (Coming Soon)</div>}
              />
              <Route
                path="rawat-jalan"
                element={
                  <div className="p-8">
                    Instalasi Rawat Jalan Page (Coming Soon)
                  </div>
                }
              />
              <Route
                path="rawat-inap"
                element={
                  <div className="p-8">
                    Instalasi Rawat Inap Page (Coming Soon)
                  </div>
                }
              />
              <Route path="antrian" element={<QueueOperator />} />
              <Route
                path="farmasi"
                element={<div className="p-8">Farmasi Page (Coming Soon)</div>}
              />
              <Route
                path="settings"
                element={<SettingsPage />}
              />
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </AppearanceProvider>
  );
}

export default App;

