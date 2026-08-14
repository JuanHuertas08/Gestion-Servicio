import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { EstadoOrdenTrabajo, PrioridadOrdenTrabajo, Rol, TipoServicioOrdenTrabajo } from "@prisma/client";
import { HttpError } from "../../middleware/errorHandler";
import {
  cancelarOrdenTrabajo,
  createOrdenTrabajo,
  getOrdenTrabajo,
  listOrdenesTrabajo,
  updateOrdenTrabajo,
} from "./ordenesTrabajo.service";
import { extraerDatosDesdePdf } from "./ordenesTrabajo.pdf";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const router = Router();

// Acceso colaborativo: cualquier Asesor o Administrador puede crear/consultar/editar/cancelar
// cualquier orden de trabajo (igual que el Excel compartido que este módulo reemplaza).
router.use(requireAuth, requireRole(Rol.ADMINISTRADOR, Rol.ASESOR));

const ordenTrabajoBodySchema = z.object({
  fechaSolicitud: z.coerce.date(),
  cliente: z.string().min(1),
  clienteNit: z.string().optional(),
  numeroClienteSap: z.string().optional(),
  asesorPssr: z.string().min(1),
  valor: z.coerce.number().optional(),
  horasServicio: z.coerce.number().optional(),
  horasDesplazamiento: z.coerce.number().optional(),
  ordenTrabajoNumero: z.string().optional(),
  tipoServicio: z.nativeEnum(TipoServicioOrdenTrabajo),
  descripcionServicio: z.string().optional(),
  sucursal: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  departamento: z.string().optional(),
  personaContacto: z.string().optional(),
  correoContacto: z.string().email().optional(),
  telefonoContacto: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  serialMaquina: z.string().optional(),
  coordinadorAltura: z.boolean().optional(),
  equipoApoyo: z.boolean().optional(),
  fechaSugerida: z.coerce.date().optional(),
  fechaProgramacionReal: z.coerce.date().optional(),
  horaServicio: z.string().optional(),
  estado: z.nativeEnum(EstadoOrdenTrabajo).optional(),
  prioridad: z.nativeEnum(PrioridadOrdenTrabajo).optional(),
  tecnicoAsignado: z.string().optional(),
  codigoSap: z.string().optional(),
  fechaCierre: z.coerce.date().optional(),
  observaciones: z.string().optional(),
  programadorSegunSede: z.string().optional(),
  unidadIntervenirTaller: z.boolean().optional(),
  tipoTrabajo: z.string().optional(),
  fechaTrasladoTaller: z.coerce.date().optional(),
  reporteClick: z.boolean().optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const input = ordenTrabajoBodySchema.parse(req.body);
    const orden = await createOrdenTrabajo(input, req.user!.sub);
    res.status(201).json(orden);
  } catch (err) {
    next(err);
  }
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  cliente: z.string().optional(),
  asesorPssr: z.string().optional(),
  estado: z.nativeEnum(EstadoOrdenTrabajo).optional(),
  prioridad: z.nativeEnum(PrioridadOrdenTrabajo).optional(),
  ciudad: z.string().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listOrdenesTrabajo(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/extraer-pdf", upload.single("archivo"), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, "Debe adjuntar un archivo .pdf");
    const datos = await extraerDatosDesdePdf(req.file.buffer);
    res.json(datos);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const orden = await getOrdenTrabajo(req.params.id);
    res.json(orden);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const input = ordenTrabajoBodySchema.partial().parse(req.body);
    const orden = await updateOrdenTrabajo(req.params.id, input, req.user!.sub);
    res.json(orden);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const orden = await cancelarOrdenTrabajo(req.params.id, req.user!.sub);
    res.json(orden);
  } catch (err) {
    next(err);
  }
});

export default router;
