import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  // Minutos de inactividad antes de cerrar la sesión automáticamente (ventana deslizante: cada
  // request autenticado la renueva, ver middleware/auth.ts).
  sessionIdleMinutes: Number(process.env.SESSION_IDLE_MINUTES ?? 10),
  port: Number(process.env.PORT ?? 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  seedAdminDocumento: process.env.SEED_ADMIN_DOCUMENTO ?? "admin",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "Admin123!",
};
