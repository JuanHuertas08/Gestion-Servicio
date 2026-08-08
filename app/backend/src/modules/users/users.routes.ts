import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { Rol } from "@prisma/client";
import {
  createUser,
  listAuditLogs,
  listUsers,
  setUserActivo,
  updateUser,
} from "./users.service";

const router = Router();

router.use(requireAuth, requireRole(Rol.ADMINISTRADOR));

const createSchema = z.object({
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  numeroDocumento: z.string().min(1),
  correo: z.string().email(),
  telefono: z.string().min(1),
  rol: z.nativeEnum(Rol),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

router.post("/", async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const user = await createUser(input, req.user!.sub);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  busqueda: z.string().optional(),
  rol: z.nativeEnum(Rol).optional(),
  activo: z.coerce.boolean().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listUsers(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/auditoria", async (req, res, next) => {
  try {
    const targetUserId = typeof req.query.usuarioId === "string" ? req.query.usuarioId : undefined;
    const logs = await listAuditLogs(targetUserId);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  nombres: z.string().min(1).optional(),
  apellidos: z.string().min(1).optional(),
  correo: z.string().email().optional(),
  telefono: z.string().min(1).optional(),
  rol: z.nativeEnum(Rol).optional(),
  password: z.string().min(8).optional(),
});

router.put("/:id", async (req, res, next) => {
  try {
    const input = updateSchema.parse(req.body);
    const user = await updateUser(req.params.id, input, req.user!.sub);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/estado", async (req, res, next) => {
  try {
    const { activo } = z.object({ activo: z.boolean() }).parse(req.body);
    const user = await setUserActivo(req.params.id, activo, req.user!.sub);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
