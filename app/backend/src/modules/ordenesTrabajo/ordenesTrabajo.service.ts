import { prisma } from "../../config/prisma";
import { HttpError } from "../../middleware/errorHandler";
import {
  AccionAuditoria,
  EstadoOrdenTrabajo,
  Prisma,
  PrioridadOrdenTrabajo,
  TipoServicioOrdenTrabajo,
} from "@prisma/client";

const CAMPOS_EDITABLES = [
  "fechaSolicitud",
  "cliente",
  "clienteNit",
  "numeroClienteSap",
  "asesorPssr",
  "valor",
  "horasServicio",
  "horasDesplazamiento",
  "ordenTrabajoNumero",
  "tipoServicio",
  "descripcionServicio",
  "sucursal",
  "direccion",
  "ciudad",
  "departamento",
  "personaContacto",
  "correoContacto",
  "telefonoContacto",
  "marca",
  "modelo",
  "serialMaquina",
  "coordinadorAltura",
  "equipoApoyo",
  "fechaSugerida",
  "fechaProgramacionReal",
  "horaServicio",
  "estado",
  "prioridad",
  "tecnicoAsignado",
  "codigoSap",
  "fechaCierre",
  "observaciones",
  "programadorSegunSede",
  "unidadIntervenirTaller",
  "tipoTrabajo",
  "fechaTrasladoTaller",
  "reporteClick",
] as const;

export interface OrdenTrabajoInput {
  fechaSolicitud: Date;
  cliente: string;
  clienteNit?: string;
  numeroClienteSap?: string;
  asesorPssr: string;
  valor?: number;
  horasServicio?: number;
  horasDesplazamiento?: number;
  ordenTrabajoNumero?: string;
  tipoServicio: TipoServicioOrdenTrabajo;
  descripcionServicio?: string;
  sucursal?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  personaContacto?: string;
  correoContacto?: string;
  telefonoContacto?: string;
  marca?: string;
  modelo?: string;
  serialMaquina?: string;
  coordinadorAltura?: boolean;
  equipoApoyo?: boolean;
  fechaSugerida?: Date;
  fechaProgramacionReal?: Date;
  horaServicio?: string;
  estado?: EstadoOrdenTrabajo;
  prioridad?: PrioridadOrdenTrabajo;
  tecnicoAsignado?: string;
  codigoSap?: string;
  fechaCierre?: Date;
  observaciones?: string;
  programadorSegunSede?: string;
  unidadIntervenirTaller?: boolean;
  tipoTrabajo?: string;
  fechaTrasladoTaller?: Date;
  reporteClick?: boolean;
}

export async function createOrdenTrabajo(input: OrdenTrabajoInput, actorUserId: string) {
  const orden = await prisma.ordenTrabajo.create({
    data: { ...input, creadoPorId: actorUserId },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      accion: AccionAuditoria.CREAR,
      entidad: "OrdenTrabajo",
      cambios: { ordenTrabajoId: orden.id, numero: orden.numero, cliente: orden.cliente },
    },
  });

  return orden;
}

export async function updateOrdenTrabajo(
  id: string,
  input: Partial<OrdenTrabajoInput>,
  actorUserId: string
) {
  const existing = await prisma.ordenTrabajo.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Orden de trabajo no encontrada");

  const data: Record<string, unknown> = {};
  const cambios: Record<string, { antes: unknown; despues: unknown }> = {};

  CAMPOS_EDITABLES.forEach((campo) => {
    const valor = (input as Record<string, unknown>)[campo];
    if (valor !== undefined) {
      const anterior = (existing as Record<string, unknown>)[campo];
      const cambio =
        anterior instanceof Date || valor instanceof Date
          ? String(anterior) !== String(valor)
          : anterior?.toString() !== valor?.toString();
      if (cambio) {
        cambios[campo] = { antes: anterior, despues: valor };
        data[campo] = valor;
      }
    }
  });

  if (Object.keys(data).length === 0) return existing;

  data.actualizadoPorId = actorUserId;

  const orden = await prisma.ordenTrabajo.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      accion: AccionAuditoria.EDITAR,
      entidad: "OrdenTrabajo",
      cambios: { ordenTrabajoId: id, numero: orden.numero, ...cambios },
    },
  });

  return orden;
}

/** "Eliminar" no borra la fila: la pasa a estado CANCELADO (queda en el historial/auditoría). */
export async function cancelarOrdenTrabajo(id: string, actorUserId: string) {
  const existing = await prisma.ordenTrabajo.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Orden de trabajo no encontrada");

  const orden = await prisma.ordenTrabajo.update({
    where: { id },
    data: { estado: EstadoOrdenTrabajo.CANCELADO, actualizadoPorId: actorUserId },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      accion: AccionAuditoria.INACTIVAR,
      entidad: "OrdenTrabajo",
      cambios: { ordenTrabajoId: id, numero: orden.numero, cliente: orden.cliente },
    },
  });

  return orden;
}

export async function getOrdenTrabajo(id: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } });
  if (!orden) throw new HttpError(404, "Orden de trabajo no encontrada");
  return orden;
}

export interface ListOrdenesTrabajoParams {
  page: number;
  pageSize: number;
  cliente?: string;
  asesorPssr?: string;
  estado?: EstadoOrdenTrabajo;
  prioridad?: PrioridadOrdenTrabajo;
  ciudad?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export async function listOrdenesTrabajo(params: ListOrdenesTrabajoParams) {
  const { page, pageSize, cliente, asesorPssr, estado, prioridad, ciudad, fechaDesde, fechaHasta } =
    params;

  const where: Prisma.OrdenTrabajoWhereInput = {
    ...(cliente ? { cliente: { contains: cliente, mode: "insensitive" as const } } : {}),
    ...(asesorPssr ? { asesorPssr: { equals: asesorPssr, mode: "insensitive" as const } } : {}),
    ...(estado ? { estado } : {}),
    ...(prioridad ? { prioridad } : {}),
    ...(ciudad ? { ciudad: { contains: ciudad, mode: "insensitive" as const } } : {}),
    ...(fechaDesde || fechaHasta
      ? {
          fechaSolicitud: {
            ...(fechaDesde ? { gte: fechaDesde } : {}),
            ...(fechaHasta ? { lte: fechaHasta } : {}),
          },
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.ordenTrabajo.count({ where }),
    prisma.ordenTrabajo.findMany({
      where,
      orderBy: { fechaSolicitud: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { total, page, pageSize, data };
}
