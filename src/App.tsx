import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import AuthCallback from "./pages/auth/AuthCallback";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import UsersPage from "./pages/Users";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              {/* Add other routes here as we build them */}
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
              <Route
                path="antrian"
                element={<div className="p-8">Antrian Page (Coming Soon)</div>}
              />
              <Route
                path="farmasi"
                element={<div className="p-8">Farmasi Page (Coming Soon)</div>}
              />
              <Route
                path="settings"
                element={<div className="p-8">Settings Page (Coming Soon)</div>}
              />
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
