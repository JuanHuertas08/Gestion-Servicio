import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { CambiarPassword } from "./pages/CambiarPassword";
import { UsersList } from "./pages/usuarios/UsersList";
import { AuditLogView } from "./pages/usuarios/AuditLogView";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { FacturacionPage } from "./pages/facturacion/FacturacionPage";
import { ProyeccionPage } from "./pages/proyeccion/ProyeccionPage";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/cambiar-password" element={<CambiarPassword />} />
                <Route element={<ProtectedRoute allowedRoles={["ADMINISTRADOR"]} />}>
                  <Route path="/facturacion" element={<FacturacionPage />} />
                  <Route path="/usuarios" element={<UsersList />} />
                  <Route path="/usuarios/auditoria" element={<AuditLogView />} />
                  <Route path="/usuarios/:id/auditoria" element={<AuditLogView />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={["ADMINISTRADOR", "ASESOR"]} />}>
                  <Route path="/proyeccion" element={<ProyeccionPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
