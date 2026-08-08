import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { EstadoSeguimiento, Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../middleware/errorHandler";
import {
  listFiltrosSeguimiento,
  listHistorialSeguimiento,
  listSeguimientoClientes,
  registrarSeguimiento,
} from "./proyeccion.service";

const router = Router();

// Todo el módulo de Proyección de seguimiento queda restringido a Administrador y Asesor.
router.use(requireAuth, requireRole(Rol.ADMINISTRADOR, Rol.ASESOR));

async function nombreCompletoDe(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { nombres: true, apellidos: true } });
  if (!user) throw new HttpError(401, "No autenticado");
  return `${user.nombres} ${user.apellidos}`;
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  asesor: z.string().optional(),
  cliente: z.string().optional(),
  tipoFacturacion: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const requesterNombreCompleto = await nombreCompletoDe(req.user!.sub);
    const result = await listSeguimientoClientes({
      ...query,
      requesterRol: req.user!.rol,
      requesterNombreCompleto,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/filtros", async (req, res, next) => {
  try {
    const requesterNombreCompleto = await nombreCompletoDe(req.user!.sub);
    const filtros = await listFiltrosSeguimiento(req.user!.rol, requesterNombreCompleto);
    res.json(filtros);
  } catch (err) {
    next(err);
  }
});

const registrarSchema = z.object({
  cliente: z.string().min(1),
  tipoFacturacion: z.string().min(1),
  estado: z.nativeEnum(EstadoSeguimiento),
  fechaSeguimiento: z.coerce.date(),
  observaciones: z.string().optional(),
});

router.post("/registrar", async (req, res, next) => {
  try {
    const input = registrarSchema.parse(req.body);
    const requesterNombreCompleto = await nombreCompletoDe(req.user!.sub);
    const seguimiento = await registrarSeguimiento({
      ...input,
      requesterId: req.user!.sub,
      requesterRol: req.user!.rol,
      requesterNombreCompleto,
    });
    res.status(201).json(seguimiento);
  } catch (err) {
    next(err);
  }
});

const historialQuerySchema = z.object({
  cliente: z.string().min(1),
  tipoFacturacion: z.string().min(1),
});

router.get("/historial", async (req, res, next) => {
  try {
    const query = historialQuerySchema.parse(req.query);
    const requesterNombreCompleto = await nombreCompletoDe(req.user!.sub);
    const historial = await listHistorialSeguimiento({
      ...query,
      requesterRol: req.user!.rol,
      requesterNombreCompleto,
    });
    res.json(historial);
  } catch (err) {
    next(err);
  }
});

export default router;
