import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Layout } from "./components/Layout";
import { GlobalLoadingBar } from "./components/GlobalLoadingBar";
import { Login } from "./pages/Login";
import { CambiarPassword } from "./pages/CambiarPassword";
import { UsersList } from "./pages/usuarios/UsersList";
import { AuditLogView } from "./pages/usuarios/AuditLogView";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { FacturacionPage } from "./pages/facturacion/FacturacionPage";
import { ProyeccionPage } from "./pages/proyeccion/ProyeccionPage";
import { OrdenesTrabajoList } from "./pages/ordenesTrabajo/OrdenesTrabajoList";
import { ServicioPage } from "./pages/servicio/ServicioPage";
import { SinAccesoPage } from "./pages/SinAccesoPage";
import { useAuth } from "./auth/AuthContext";

function HomeRoute() {
  const { user } = useAuth();
  if (user?.rol === "TECNICO_SERVICIO") return <SinAccesoPage />;
  // Servicio Admin solo tiene acceso a Servicio > Servicios programados: lo llevamos directo ahí
  // en vez de mostrarle el Tablero (que no le corresponde).
  if (user?.rol === "SERVICIO_ADMIN") return <Navigate to="/servicio" replace />;
  return <Dashboard />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalLoadingBar />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<HomeRoute />} />
                <Route path="/cambiar-password" element={<CambiarPassword />} />
                <Route element={<ProtectedRoute allowedRoles={["ADMINISTRADOR"]} />}>
                  <Route path="/facturacion" element={<FacturacionPage />} />
                  <Route path="/usuarios" element={<UsersList />} />
                  <Route path="/usuarios/auditoria" element={<AuditLogView />} />
                  <Route path="/usuarios/:id/auditoria" element={<AuditLogView />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={["ADMINISTRADOR", "ASESOR"]} />}>
                  <Route path="/proyeccion" element={<ProyeccionPage />} />
                  <Route path="/ordenes-trabajo" element={<OrdenesTrabajoList />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={["ADMINISTRADOR", "SERVICIO_ADMIN"]} />}>
                  <Route path="/servicio" element={<ServicioPage />} />
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
