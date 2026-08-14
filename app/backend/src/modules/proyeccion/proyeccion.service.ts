import { prisma } from "../../config/prisma";
import { EstadoSeguimiento, Prisma, Rol } from "@prisma/client";
import { HttpError } from "../../middleware/errorHandler";
import { calcularProximaFechaSeguimiento, getDiasSeguimientoMap } from "../facturacion/parametrosSeguimiento";
import { listAsesores } from "../asesores/asesores.service";

export interface BaseSeguimientoParams {
  asesor?: string;
  cliente?: string;
  tipoFacturacion?: string;
  requesterRol: Rol;
  requesterNombreCompleto: string;
}

export interface ListSeguimientoParams extends BaseSeguimientoParams {
  page: number;
  pageSize: number;
  estado?: EstadoSeguimiento;
}

function buildWhere(params: BaseSeguimientoParams): Prisma.FacturaWhereInput {
  const { asesor, cliente, tipoFacturacion, requesterRol, requesterNombreCompleto } = params;

  return {
    activo: true,
    cliente: { not: null },
    tipoFacturacion: { not: null },
    ...(cliente ? { cliente: { contains: cliente, mode: "insensitive" as const } } : {}),
    ...(tipoFacturacion ? { tipoFacturacion } : {}),
    ...(requesterRol === Rol.ASESOR
      ? { pssr: { equals: requesterNombreCompleto, mode: "insensitive" as const } }
      : asesor
        ? { pssr: { equals: asesor, mode: "insensitive" as const } }
        : {}),
  };
}

interface GrupoConEstado {
  cliente: string;
  tipoFacturacion: string;
  pssr: string | null;
  ultimaFechaFacturacion: Date | null;
  fechaUltimoSeguimiento: Date | null;
  fechaProximoSeguimiento: Date | null;
  estado: EstadoSeguimiento;
  observaciones: string | null;
}

/**
 * Calcula, para todos los grupos (cliente, tipo de facturación) que matchean los filtros de
 * Factura, su estado de seguimiento más reciente. No pagina: el dataset es pequeño (cientos a
 * pocos miles de grupos), así que filtrar por estado (que depende del historial de seguimiento,
 * no de un campo de Factura) se resuelve completo en memoria antes de paginar.
 */
async function calcularGruposConEstado(baseParams: BaseSeguimientoParams): Promise<GrupoConEstado[]> {
  const where = buildWhere(baseParams);

  const ultimasFacturas = await prisma.factura.findMany({
    where,
    distinct: ["cliente", "tipoFacturacion"],
    orderBy: [{ fechaFacturacion: "desc" }],
    select: { cliente: true, tipoFacturacion: true, pssr: true, fechaFacturacion: true },
  });

  if (ultimasFacturas.length === 0) return [];

  const [seguimientos, diasPorTipo] = await Promise.all([
    // Historial: puede haber varias filas por (cliente, tipoFacturacion); nos quedamos con la
    // más reciente de cada grupo (por fecha de seguimiento y, en empate, por fecha de registro).
    prisma.clienteSeguimiento.findMany({
      where: {
        OR: ultimasFacturas.map((f) => ({
          cliente: f.cliente as string,
          tipoFacturacion: f.tipoFacturacion as string,
        })),
      },
      distinct: ["cliente", "tipoFacturacion"],
      orderBy: [{ fechaSeguimiento: "desc" }, { createdAt: "desc" }],
    }),
    getDiasSeguimientoMap(),
  ]);
  const seguimientoMap = new Map(seguimientos.map((s) => [`${s.cliente}::${s.tipoFacturacion}`, s]));

  return ultimasFacturas.map((f) => {
    const seguimiento = seguimientoMap.get(`${f.cliente}::${f.tipoFacturacion}`);
    const fechaUltimoSeguimiento = seguimiento?.fechaSeguimiento ?? null;
    // Si ya se registró un seguimiento, la próxima fecha se proyecta desde esa fecha; si nunca se
    // ha registrado, se proyecta desde la última fecha de facturación.
    const fechaBase = fechaUltimoSeguimiento ?? f.fechaFacturacion;
    return {
      cliente: f.cliente as string,
      tipoFacturacion: f.tipoFacturacion as string,
      pssr: f.pssr,
      ultimaFechaFacturacion: f.fechaFacturacion,
      fechaUltimoSeguimiento,
      fechaProximoSeguimiento: calcularProximaFechaSeguimiento(fechaBase, f.tipoFacturacion, diasPorTipo),
      estado: seguimiento?.estado ?? EstadoSeguimiento.PENDIENTE,
      observaciones: seguimiento?.observaciones ?? null,
    };
  });
}

export async function listSeguimientoClientes(params: ListSeguimientoParams) {
  const { page, pageSize, estado } = params;
  let grupos = await calcularGruposConEstado(params);

  if (estado) {
    grupos = grupos.filter((g) => g.estado === estado);
  }

  const total = grupos.length;
  const data = grupos.slice((page - 1) * pageSize, page * pageSize);

  return { total, page, pageSize, data };
}

/**
 * Resumen (independiente del filtro de estado, ya que lo describe): total de clientes distintos
 * asignados, total de seguimientos proyectados (combinaciones cliente + tipo de facturación),
 * cuántos realizados, cuántos pendientes y el % de cumplimiento resultante.
 */
export async function getResumenSeguimiento(params: BaseSeguimientoParams) {
  const grupos = await calcularGruposConEstado(params);

  const clientesAsignados = new Set(grupos.map((g) => g.cliente)).size;
  const seguimientosProyectados = grupos.length;
  const realizados = grupos.filter((g) => g.estado === EstadoSeguimiento.REALIZADO).length;
  const pendientes = seguimientosProyectados - realizados;

  return {
    clientesAsignados,
    seguimientosProyectados,
    realizados,
    pendientes,
    cumplimientoPct: seguimientosProyectados > 0 ? realizados / seguimientosProyectados : 0,
  };
}

export async function listFiltrosSeguimiento(requesterRol: Rol, requesterNombreCompleto: string) {
  const asesorFiltro: Prisma.StringNullableFilter | undefined =
    requesterRol === Rol.ASESOR ? { equals: requesterNombreCompleto, mode: "insensitive" } : undefined;

  const [asesores, tipos] = await Promise.all([
    listAsesores({ requesterRol, requesterNombreCompleto }),
    prisma.factura.findMany({
      where: { activo: true, tipoFacturacion: { not: null }, ...(asesorFiltro ? { pssr: asesorFiltro } : {}) },
      distinct: ["tipoFacturacion"],
      select: { tipoFacturacion: true },
      orderBy: { tipoFacturacion: "asc" },
    }),
  ]);

  return {
    asesores: asesores.map((a) => a.nombreCompleto),
    tiposFacturacion: tipos.map((t) => t.tipoFacturacion).filter((v): v is string => !!v),
  };
}

export interface RegistrarSeguimientoInput {
  cliente: string;
  tipoFacturacion: string;
  estado: EstadoSeguimiento;
  fechaSeguimiento: Date;
  observaciones?: string;
  requesterId: string;
  requesterRol: Rol;
  requesterNombreCompleto: string;
}

async function assertPropietarioAsesor(
  cliente: string,
  tipoFacturacion: string,
  requesterRol: Rol,
  requesterNombreCompleto: string
) {
  if (requesterRol !== Rol.ASESOR) return;
  const ultima = await prisma.factura.findFirst({
    where: { activo: true, cliente, tipoFacturacion },
    orderBy: { fechaFacturacion: "desc" },
    select: { pssr: true },
  });
  if (!ultima || (ultima.pssr ?? "").toLowerCase() !== requesterNombreCompleto.toLowerCase()) {
    throw new HttpError(403, "Solo puede consultar/registrar el seguimiento de sus propios clientes");
  }
}

export async function registrarSeguimiento(input: RegistrarSeguimientoInput) {
  const {
    cliente,
    tipoFacturacion,
    estado,
    fechaSeguimiento,
    observaciones,
    requesterId,
    requesterRol,
    requesterNombreCompleto,
  } = input;

  await assertPropietarioAsesor(cliente, tipoFacturacion, requesterRol, requesterNombreCompleto);

  return prisma.clienteSeguimiento.create({
    data: {
      cliente,
      tipoFacturacion,
      estado,
      fechaSeguimiento,
      observaciones,
      registradoPorId: requesterId,
    },
  });
}

export async function listHistorialSeguimiento(params: {
  cliente: string;
  tipoFacturacion: string;
  requesterRol: Rol;
  requesterNombreCompleto: string;
}) {
  const { cliente, tipoFacturacion, requesterRol, requesterNombreCompleto } = params;

  await assertPropietarioAsesor(cliente, tipoFacturacion, requesterRol, requesterNombreCompleto);

  return prisma.clienteSeguimiento.findMany({
    where: { cliente, tipoFacturacion },
    orderBy: [{ fechaSeguimiento: "desc" }, { createdAt: "desc" }],
    include: {
      registradoPor: { select: { nombres: true, apellidos: true, numeroDocumento: true } },
    },
  });
}
