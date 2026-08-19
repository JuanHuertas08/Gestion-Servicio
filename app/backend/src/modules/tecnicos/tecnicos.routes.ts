import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { Rol } from "@prisma/client";
import {
  createTecnico,
  getTecnico,
  listTecnicos,
  setTecnicoActivo,
  updateTecnico,
} from "./tecnicos.service";

const router = Router();

// Administración de alistamientos: quien crea/gestiona los técnicos es el Administrador.
router.use(requireAuth, requireRole(Rol.ADMINISTRADOR));

const capacidadSchema = z.object({
  mes: z.number().int().min(1).max(12),
  capacidadDiaria: z.number().int().min(0),
});

const tecnicoBodySchema = z.object({
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.string().email().optional(),
  capacidades: z.array(capacidadSchema).optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const input = tecnicoBodySchema.parse(req.body);
    const tecnico = await createTecnico(input, req.user!.sub);
    res.status(201).json(tecnico);
  } catch (err) {
    next(err);
  }
});

const listQuerySchema = z.object({
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const tecnicos = await listTecnicos(query);
    res.json(tecnicos);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const tecnico = await getTecnico(req.params.id);
    res.json(tecnico);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const input = tecnicoBodySchema.partial().parse(req.body);
    const tecnico = await updateTecnico(req.params.id, input, req.user!.sub);
    res.json(tecnico);
  } catch (err) {
    next(err);
  }
});

const activoSchema = z.object({ activo: z.boolean() });

router.patch("/:id/activo", async (req, res, next) => {
  try {
    const { activo } = activoSchema.parse(req.body);
    const tecnico = await setTecnicoActivo(req.params.id, activo, req.user!.sub);
    res.json(tecnico);
  } catch (err) {
    next(err);
  }
});

export default router;
