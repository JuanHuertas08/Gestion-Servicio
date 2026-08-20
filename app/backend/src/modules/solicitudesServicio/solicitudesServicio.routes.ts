import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { EstadoSolicitudServicio, Rol } from "@prisma/client";
import {
  aprobarSolicitudServicio,
  cancelarSolicitudServicio,
  createSolicitudServicio,
  getTecnicosDisponibles,
  listSolicitudesServicio,
  updateSolicitudServicio,
} from "./solicitudesServicio.service";

const router = Router();

router.use(requireAuth);

// Crear y cancelar solicitudes es parte de la pestaña "Solicitud de servicio" (solo Administrador).
const soloAdministrador = requireRole(Rol.ADMINISTRADOR);
// Listar, ver técnicos disponibles, aprobar y editar técnico/fecha/hora son parte de "Servicios
// programados" también (Administrador + el nuevo rol Servicio Admin).
const administradorOServicioAdmin = requireRole(Rol.ADMINISTRADOR, Rol.SERVICIO_ADMIN);

const bodySchema = z.object({
  ordenTrabajoId: z.string().min(1),
  fechaSolicitada: z.coerce.date(),
  observaciones: z.string().optional(),
});

router.post("/", soloAdministrador, async (req, res, next) => {
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
  fechaProgramadaDesde: z.coerce.date().optional(),
  fechaProgramadaHasta: z.coerce.date().optional(),
});

router.get("/", administradorOServicioAdmin, async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listSolicitudesServicio(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const tecnicosDisponiblesQuerySchema = z.object({
  fecha: z.coerce.date(),
});

router.get("/tecnicos-disponibles", administradorOServicioAdmin, async (req, res, next) => {
  try {
    const { fecha } = tecnicosDisponiblesQuerySchema.parse(req.query);
    const tecnicos = await getTecnicosDisponibles(fecha);
    res.json(tecnicos);
  } catch (err) {
    next(err);
  }
});

const aprobarSchema = z.object({
  tecnicoId: z.string().min(1),
  fechaProgramada: z.coerce.date(),
  horaProgramada: z.string().min(1),
});

router.post("/:id/aprobar", administradorOServicioAdmin, async (req, res, next) => {
  try {
    const input = aprobarSchema.parse(req.body);
    const solicitud = await aprobarSolicitudServicio(req.params.id, input, req.user!.sub);
    res.json(solicitud);
  } catch (err) {
    next(err);
  }
});

const updateBodySchema = bodySchema.partial().extend({
  tecnicoId: z.string().min(1).optional(),
  fechaProgramada: z.coerce.date().optional(),
  horaProgramada: z.string().min(1).optional(),
});

router.put("/:id", administradorOServicioAdmin, async (req, res, next) => {
  try {
    const input = updateBodySchema.parse(req.body);
    const solicitud = await updateSolicitudServicio(req.params.id, input, req.user!.sub);
    res.json(solicitud);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", soloAdministrador, async (req, res, next) => {
  try {
    const solicitud = await cancelarSolicitudServicio(req.params.id, req.user!.sub);
    res.json(solicitud);
  } catch (err) {
    next(err);
  }
});

export default router;
