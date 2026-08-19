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
    include: { ordenTrabajo: ORDEN_TRABAJO_RESUMEN },
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

  const data: Record<string, unknown> = {};
  const cambios: Record<string, { antes: unknown; despues: unknown }> = {};

  (["ordenTrabajoId", "fechaSolicitada", "observaciones"] as const).forEach((campo) => {
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
    return prisma.solicitudServicio.findUnique({
      where: { id },
      include: { ordenTrabajo: ORDEN_TRABAJO_RESUMEN },
    });
  }

  const solicitud = await prisma.solicitudServicio.update({
    where: { id },
    data,
    include: { ordenTrabajo: ORDEN_TRABAJO_RESUMEN },
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
    include: { ordenTrabajo: ORDEN_TRABAJO_RESUMEN },
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

export interface ListSolicitudesServicioParams {
  page: number;
  pageSize: number;
  estado?: EstadoSolicitudServicio;
  cliente?: string;
}

export async function listSolicitudesServicio(params: ListSolicitudesServicioParams) {
  const { page, pageSize, estado, cliente } = params;

  const where = {
    ...(estado ? { estado } : {}),
    ...(cliente ? { ordenTrabajo: { cliente: { contains: cliente, mode: "insensitive" as const } } } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.solicitudServicio.count({ where }),
    prisma.solicitudServicio.findMany({
      where,
      orderBy: { fechaSolicitada: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { ordenTrabajo: ORDEN_TRABAJO_RESUMEN },
    }),
  ]);

  return { total, page, pageSize, data };
}
