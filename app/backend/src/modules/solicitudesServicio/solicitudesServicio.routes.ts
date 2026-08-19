import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { EstadoSolicitudServicio, Rol } from "@prisma/client";
import {
  cancelarSolicitudServicio,
  createSolicitudServicio,
  listSolicitudesServicio,
  updateSolicitudServicio,
} from "./solicitudesServicio.service";

const router = Router();

router.use(requireAuth, requireRole(Rol.ADMINISTRADOR));

const bodySchema = z.object({
  ordenTrabajoId: z.string().min(1),
  fechaSolicitada: z.coerce.date(),
  observaciones: z.string().optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const input = bodySchema.parse(req.body);
    const solicitud = await createSolicitudServicio(input, req.user!.sub);
    res.status(201).json(solicitud);
  } catch (err) {
    next(err);
  }
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  estado: z.nativeEnum(EstadoSolicitudServicio).optional(),
  cliente: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listSolicitudesServicio(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const input = bodySchema.partial().parse(req.body);
    const solicitud = await updateSolicitudServicio(req.params.id, input, req.user!.sub);
    res.json(solicitud);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const solicitud = await cancelarSolicitudServicio(req.params.id, req.user!.sub);
    res.json(solicitud);
  } catch (err) {
    next(err);
  }
});

export default router;
