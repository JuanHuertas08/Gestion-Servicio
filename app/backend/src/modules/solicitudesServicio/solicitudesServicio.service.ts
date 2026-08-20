import { prisma } from "../../config/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { AccionAuditoria, EstadoSolicitudServicio } from "@prisma/client";

const ORDEN_TRABAJO_RESUMEN = {
  select: {
    numero: true,
    cliente: true,
    ciudad: true,
    marca: true,
    modelo: true,
    serialMaquina: true,
    asesorPssr: true,
  },
} as const;

const TECNICO_RESUMEN = {
  select: { id: true, nombres: true, apellidos: true },
} as const;

const SOLICITUD_INCLUDE = {
  ordenTrabajo: ORDEN_TRABAJO_RESUMEN,
  tecnico: TECNICO_RESUMEN,
} as const;

export interface SolicitudServicioInput {
  ordenTrabajoId: string;
  fechaSolicitada: Date;
  observaciones?: string;
}

export async function createSolicitudServicio(input: SolicitudServicioInput, actorUserId: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id: input.ordenTrabajoId } });
  if (!orden) throw new HttpError(404, "La orden de trabajo seleccionada no existe");

  const solicitud = await prisma.solicitudServicio.create({
    data: {
      ordenTrabajoId: input.ordenTrabajoId,
      fechaSolicitada: input.fechaSolicitada,
      observaciones: input.observaciones,
      creadoPorId: actorUserId,
    },
    include: SOLICITUD_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      accion: AccionAuditoria.CREAR,
      entidad: "SolicitudServicio",
      cambios: {
        solicitudId: solicitud.id,
        numero: solicitud.numero,
        ordenTrabajoNumero: orden.numero,
        cliente: orden.cliente,
      },
    },
  });

  return solicitud;
}

export interface UpdateSolicitudServicioInput {
  ordenTrabajoId?: string;
  fechaSolicitada?: Date;
  observaciones?: string;
  tecnicoId?: string;
  fechaProgramada?: Date;
  horaProgramada?: string;
}

export async function updateSolicitudServicio(
  id: string,
  input: UpdateSolicitudServicioInput,
  actorUserId: string
) {
  const existing = await prisma.solicitudServicio.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Solicitud de servicio no encontrada");

  if (input.ordenTrabajoId) {
    const orden = await prisma.ordenTrabajo.findUnique({ where: { id: input.ordenTrabajoId } });
    if (!orden) throw new HttpError(404, "La orden de trabajo seleccionada no existe");
  }
  if (input.tecnicoId) {
    const tecnico = await prisma.tecnico.findUnique({ where: { id: input.tecnicoId } });
    if (!tecnico) throw new HttpError(404, "El técnico seleccionado no existe");
  }

  const data: Record<string, unknown> = {};
  const cambios: Record<string, { antes: unknown; despues: unknown }> = {};

  (
    ["ordenTrabajoId", "fechaSolicitada", "observaciones", "tecnicoId", "fechaProgramada", "horaProgramada"] as const
  ).forEach((campo) => {
    const valor = input[campo];
    if (valor !== undefined) {
      const anterior = existing[campo];
      const cambio =
        anterior instanceof Date || valor instanceof Date
          ? String(anterior) !== String(valor)
          : anterior !== valor;
      if (cambio) {
        cambios[campo] = { antes: anterior, despues: valor };
        data[campo] = valor;
      }
    }
  });

  if (Object.keys(data).length === 0) {
    return prisma.solicitudServicio.findUnique({ where: { id }, include: SOLICITUD_INCLUDE });
  }

  const solicitud = await prisma.solicitudServicio.update({
    where: { id },
    data,
    include: SOLICITUD_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      accion: AccionAuditoria.EDITAR,
      entidad: "SolicitudServicio",
      cambios: { solicitudId: id, numero: solicitud.numero, ...cambios },
    },
  });

  return solicitud;
}

/** "Eliminar" no borra la fila: la pasa a estado CANCELADA. */
export async function cancelarSolicitudServicio(id: string, actorUserId: string) {
  const existing = await prisma.solicitudServicio.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Solicitud de servicio no encontrada");

  const solicitud = await prisma.solicitudServicio.update({
    where: { id },
    data: { estado: EstadoSolicitudServicio.CANCELADA },
    include: SOLICITUD_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      accion: AccionAuditoria.INACTIVAR,
      entidad: "SolicitudServicio",
      cambios: { solicitudId: id, numero: solicitud.numero },
    },
  });

  return solicitud;
}

export interface AprobarSolicitudServicioInput {
  tecnicoId: string;
  fechaProgramada: Date;
  horaProgramada: string;
}

/** PENDIENTE -> PROGRAMADA: asigna técnico, fecha y hora, y registra quién y cuándo aprobó. */
export async function aprobarSolicitudServicio(
  id: string,
  input: AprobarSolicitudServicioInput,
  actorUserId: string
) {
  const existing = await prisma.solicitudServicio.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Solicitud de servicio no encontrada");
  if (existing.estado !== EstadoSolicitudServicio.PENDIENTE) {
    throw new HttpError(400, "Solo se pueden aprobar solicitudes en estado Pendiente");
  }

  const tecnico = await prisma.tecnico.findUnique({ where: { id: input.tecnicoId } });
  if (!tecnico) throw new HttpError(404, "El técnico seleccionado no existe");
  if (!tecnico.activo) throw new HttpError(400, "El técnico seleccionado está inactivo");

  const solicitud = await prisma.solicitudServicio.update({
    where: { id },
    data: {
      estado: EstadoSolicitudServicio.PROGRAMADA,
      tecnicoId: input.tecnicoId,
      fechaProgramada: input.fechaProgramada,
      horaProgramada: input.horaProgramada,
      aprobadoPorId: actorUserId,
      fechaAprobacion: new Date(),
    },
    include: SOLICITUD_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      accion: AccionAuditoria.EDITAR,
      entidad: "SolicitudServicio",
      cambios: {
        solicitudId: id,
        numero: solicitud.numero,
        aprobada: true,
        tecnico: `${tecnico.nombres} ${tecnico.apellidos}`,
        fechaProgramada: input.fechaProgramada,
        horaProgramada: input.horaProgramada,
      },
    },
  });

  return solicitud;
}

export interface TecnicoDisponible {
  id: string;
  nombreCompleto: string;
  capacidadDiaria: number;
  asignadosEseDia: number;
  disponible: boolean;
}

/**
 * Técnicos activos, con su capacidad diaria para el mes de `fecha` y cuántas solicitudes ya
 * PROGRAMADAS tiene ese técnico exactamente ese día. `disponible` = tiene capacidad ese mes y
 * todavía no llega al tope diario en esa fecha puntual.
 */
export async function getTecnicosDisponibles(fecha: Date): Promise<TecnicoDisponible[]> {
  const mes = fecha.getUTCMonth() + 1;
  const inicioDia = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  const finDia = new Date(inicioDia);
  finDia.setUTCDate(finDia.getUTCDate() + 1);

  const [tecnicos, asignaciones] = await Promise.all([
    prisma.tecnico.findMany({
      where: { activo: true },
      orderBy: [{ nombres: "asc" }, { apellidos: "asc" }],
      include: { capacidades: { where: { mes } } },
    }),
    prisma.solicitudServicio.groupBy({
      by: ["tecnicoId"],
      where: {
        estado: EstadoSolicitudServicio.PROGRAMADA,
        fechaProgramada: { gte: inicioDia, lt: finDia },
        tecnicoId: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  const asignadosPorTecnico = new Map(asignaciones.map((a) => [a.tecnicoId as string, a._count._all]));

  return tecnicos.map((t) => {
    const capacidadDiaria = t.capacidades[0]?.capacidadDiaria ?? 0;
    const asignadosEseDia = asignadosPorTecnico.get(t.id) ?? 0;
    return {
      id: t.id,
      nombreCompleto: `${t.nombres} ${t.apellidos}`,
      capacidadDiaria,
      asignadosEseDia,
      disponible: capacidadDiaria > 0 && asignadosEseDia < capacidadDiaria,
    };
  });
}

export interface ListSolicitudesServicioParams {
  page: number;
  pageSize: number;
  estado?: EstadoSolicitudServicio;
  cliente?: string;
  fechaProgramadaDesde?: Date;
  fechaProgramadaHasta?: Date;
}

export async function listSolicitudesServicio(params: ListSolicitudesServicioParams) {
  const { page, pageSize, estado, cliente, fechaProgramadaDesde, fechaProgramadaHasta } = params;

  const where = {
    ...(estado ? { estado } : {}),
    ...(cliente ? { ordenTrabajo: { cliente: { contains: cliente, mode: "insensitive" as const } } } : {}),
    ...(fechaProgramadaDesde || fechaProgramadaHasta
      ? {
          fechaProgramada: {
            ...(fechaProgramadaDesde ? { gte: fechaProgramadaDesde } : {}),
            ...(fechaProgramadaHasta ? { lte: fechaProgramadaHasta } : {}),
          },
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.solicitudServicio.count({ where }),
    prisma.solicitudServicio.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: SOLICITUD_INCLUDE,
    }),
  ]);

  return { total, page, pageSize, data };
}
