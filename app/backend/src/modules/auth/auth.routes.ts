import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { changePassword, login } from "./auth.service";
import { requireAuth } from "../../middleware/auth";
import { cookieOptions, sessionMaxAgeMs } from "../../config/cookie";
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

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { numeroDocumento, password } = loginSchema.parse(req.body);
    const { token, user } = await login(numeroDocumento, password);
    res.cookie("token", token, { ...cookieOptions, maxAge: sessionMaxAgeMs });
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
