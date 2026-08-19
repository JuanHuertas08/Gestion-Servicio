import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import facturacionRoutes from "./modules/facturacion/facturacion.routes";
import proyeccionRoutes from "./modules/proyeccion/proyeccion.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import asesoresRoutes from "./modules/asesores/asesores.routes";
import ordenesTrabajoRoutes from "./modules/ordenesTrabajo/ordenesTrabajo.routes";
import tecnicosRoutes from "./modules/tecnicos/tecnicos.routes";
import solicitudesServicioRoutes from "./modules/solicitudesServicio/solicitudesServicio.routes";

export const app = express();

// Necesario detrás de un proxy/load balancer (Render, Railway, etc.) para que Express detecte
// correctamente HTTPS (cookies "secure") y para que express-rate-limit confíe en X-Forwarded-For.
app.set("trust proxy", 1);

app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usersRoutes);
app.use("/api/facturacion", facturacionRoutes);
app.use("/api/proyeccion", proyeccionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/asesores", asesoresRoutes);
app.use("/api/ordenes-trabajo", ordenesTrabajoRoutes);
app.use("/api/tecnicos", tecnicosRoutes);
app.use("/api/solicitudes-servicio", solicitudesServicioRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
