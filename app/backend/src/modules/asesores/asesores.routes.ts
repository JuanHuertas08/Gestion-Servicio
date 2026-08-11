import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { Rol } from "@prisma/client";
import { listAsesores, listAsesoresAdmin, setAsesorActivoAdmin, updateAsesor } from "./asesores.service";

const router = Router();

router.use(requireAuth, requireRole(Rol.ADMINISTRADOR, Rol.ASESOR, Rol.CONSULTA));

router.get("/", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { nombres: true, apellidos: true },
    });
    if (!user) throw new HttpError(401, "No autenticado");

    const asesores = await listAsesores({
      requesterRol: req.user!.rol,
      requesterNombreCompleto: `${user.nombres} ${user.apellidos}`,
    });
    res.json(asesores);
  } catch (err) {
    next(err);
  }
});

const adminQuerySchema = z.object({
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

router.get("/admin", requireRole(Rol.ADMINISTRADOR), async (req, res, next) => {
  try {
    const query = adminQuerySchema.parse(req.query);
    const asesores = await listAsesoresAdmin(query);
    res.json(asesores);
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  numeroDocumento: z.string().min(1).optional(),
  correo: z.string().email().optional(),
  telefono: z.string().min(1).optional(),
});

router.put("/:id", requireRole(Rol.ADMINISTRADOR), async (req, res, next) => {
  try {
    const input = updateSchema.parse(req.body);
    const asesor = await updateAsesor(req.params.id, input, req.user!.sub);
    res.json(asesor);
  } catch (err) {
    next(err);
  }
});

const activoSchema = z.object({ activo: z.boolean() });

router.patch("/:id/activo", requireRole(Rol.ADMINISTRADOR), async (req, res, next) => {
  try {
    const { activo } = activoSchema.parse(req.body);
    const asesor = await setAsesorActivoAdmin(req.params.id, activo, req.user!.sub);
    res.json(asesor);
  } catch (err) {
    next(err);
  }
});

export default router;
