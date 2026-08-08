import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { Rol } from "@prisma/client";
import {
  getDashboardFiltros,
  getDashboardKpis,
  getSeguimientoStats,
  getVentasPorMarca,
  getVentasPorPeriodo,
  getVentasPorTipoFacturacion,
} from "./dashboard.service";

const router = Router();

router.use(requireAuth, requireRole(Rol.ADMINISTRADOR, Rol.ASESOR, Rol.CONSULTA));

const querySchema = z.object({
  anio: z.coerce.number().int().min(2000).max(2100).optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
});

router.get("/kpis", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const kpis = await getDashboardKpis(query);
    res.json(kpis);
  } catch (err) {
    next(err);
  }
});

router.get("/filtros", async (_req, res, next) => {
  try {
    const filtros = await getDashboardFiltros();
    res.json(filtros);
  } catch (err) {
    next(err);
  }
});

router.get("/ventas-por-periodo", async (req, res, next) => {
  try {
    const { anio } = querySchema.pick({ anio: true }).parse(req.query);
    const data = await getVentasPorPeriodo(anio);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/ventas-por-tipo", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const data = await getVentasPorTipoFacturacion(query);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/ventas-por-marca", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const data = await getVentasPorMarca(query);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/seguimientos", async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const data = await getSeguimientoStats(query);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
