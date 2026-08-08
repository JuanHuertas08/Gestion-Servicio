import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  importFacturacion,
  listFacturas,
  listImportBatches,
  listParametrosSeguimiento,
  updateParametrosSeguimiento,
} from "./facturacion.service";
import { AccionAuditoria, ModuloImportacion, Rol } from "@prisma/client";
import { HttpError } from "../../middleware/errorHandler";
import { prisma } from "../../config/prisma";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router = Router();

// Todo el módulo de Facturación (incluida su parametrización) queda restringido a Administrador.
router.use(requireAuth, requireRole(Rol.ADMINISTRADOR));

router.post(
  "/importar",
  upload.single("archivo"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new HttpError(400, "Debe adjuntar un archivo .xlsx");
      }
      const result = await importFacturacion({
        buffer: req.file.buffer,
        nombreArchivo: req.file.originalname,
        subidoPorId: req.user!.sub,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  centro: z.string().optional(),
  marca: z.string().optional(),
  pssr: z.string().optional(),
  cliente: z.string().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listFacturas(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/importaciones", async (_req, res, next) => {
  try {
    const batches = await listImportBatches(ModuloImportacion.FACTURACION);
    res.json(batches);
  } catch (err) {
    next(err);
  }
});

router.get("/parametros-seguimiento", async (_req, res, next) => {
  try {
    const parametros = await listParametrosSeguimiento();
    res.json(parametros);
  } catch (err) {
    next(err);
  }
});

const updateParametrosSchema = z.object({
  parametros: z
    .array(
      z.object({
        tipoFacturacion: z.enum(["REPUESTOS", "SERVICIO", "ESTIBADORES"]),
        diasSeguimiento: z.number().int().min(0).max(3650),
      })
    )
    .min(1),
});

router.put(
  "/parametros-seguimiento",
  async (req, res, next) => {
    try {
      const { parametros } = updateParametrosSchema.parse(req.body);
      const antes = await listParametrosSeguimiento();
      const actualizados = await updateParametrosSeguimiento({
        parametros,
        actualizadoPorId: req.user!.sub,
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: req.user!.sub,
          accion: AccionAuditoria.EDITAR,
          entidad: "ParametroSeguimiento",
          cambios: {
            antes: antes.map((p) => ({ tipo: p.tipoFacturacion, dias: p.diasSeguimiento })),
            despues: actualizados.map((p) => ({ tipo: p.tipoFacturacion, dias: p.diasSeguimiento })),
          },
        },
      });

      res.json(actualizados);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
