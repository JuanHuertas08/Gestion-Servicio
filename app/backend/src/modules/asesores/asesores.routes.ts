import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { Rol } from "@prisma/client";
import { listAsesores } from "./asesores.service";

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

export default router;
