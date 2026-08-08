import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { changePassword, login } from "./auth.service";
import { requireAuth } from "../../middleware/auth";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../middleware/errorHandler";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión. Intente más tarde." },
});

const loginSchema = z.object({
  numeroDocumento: z.string().min(1),
  password: z.string().min(1),
});

// En desarrollo, frontend y backend comparten "site" (localhost en distinto puerto), así que
// sameSite=strict funciona y da mejor protección CSRF. En producción, frontend (Vercel) y backend
// (Render) están en dominios distintos: la cookie solo viaja entre sitios si sameSite=none, lo que
// exige secure=true (por eso van atados a la misma condición, env.cookieSecure).
const cookieOptions = {
  httpOnly: true,
  sameSite: (env.cookieSecure ? "none" : "strict") as "none" | "strict",
  secure: env.cookieSecure,
};

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { numeroDocumento, password } = loginSchema.parse(req.body);
    const { token, user } = await login(numeroDocumento, password);
    res.cookie("token", token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
    res.json({
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      numeroDocumento: user.numeroDocumento,
      rol: user.rol,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", cookieOptions);
  res.status(204).send();
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.activo) throw new HttpError(401, "No autenticado");
    res.json({
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      numeroDocumento: user.numeroDocumento,
      correo: user.correo,
      rol: user.rol,
    });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  actualPassword: z.string().min(1),
  nuevaPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

router.post("/cambiar-password", requireAuth, async (req, res, next) => {
  try {
    const { actualPassword, nuevaPassword } = changePasswordSchema.parse(req.body);
    await changePassword(req.user!.sub, actualPassword, nuevaPassword);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
