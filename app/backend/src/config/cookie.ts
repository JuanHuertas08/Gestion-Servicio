import { env } from "./env";

// En desarrollo, frontend y backend comparten "site" (localhost en distinto puerto), así que
// sameSite=strict funciona y da mejor protección CSRF. En producción, frontend (Vercel) y backend
// (Render) están en dominios distintos: la cookie solo viaja entre sitios si sameSite=none, lo que
// exige secure=true (por eso van atados a la misma condición, env.cookieSecure).
export const cookieOptions = {
  httpOnly: true,
  sameSite: (env.cookieSecure ? "none" : "strict") as "none" | "strict",
  secure: env.cookieSecure,
};

// La sesión es de ventana deslizante: cada request autenticado renueva el token (ver
// middleware/auth.ts), de forma que se cierra sola tras N minutos sin actividad.
export const sessionMaxAgeMs = env.sessionIdleMinutes * 60 * 1000;
