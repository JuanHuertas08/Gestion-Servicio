import { prisma } from "../../config/prisma";
import { EstadoSeguimiento, Prisma, Rol } from "@prisma/client";
import { HttpError } from "../../middleware/errorHandler";
import { calcularProximaFechaSeguimiento, getDiasSeguimientoMap } from "../facturacion/parametrosSeguimiento";

export interface ListSeguimientoParams {
  page: number;
  pageSize: number;
  asesor?: string;
  cliente?: string;
  tipoFacturacion?: string;
  requesterRol: Rol;
  requesterNombreCompleto: string;
}

function buildWhere(params: ListSeguimientoParams): Prisma.FacturaWhereInput {
  const { asesor, cliente, tipoFacturacion, requesterRol, requesterNombreCompleto } = params;

  return {
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

export async function listSeguimientoClientes(params: ListSeguimientoParams) {
  const { page, pageSize } = params;
  const where = buildWhere(params);

  const grupos = await prisma.factura.findMany({
    where,
    distinct: ["cliente", "tipoFacturacion"],
    select: { cliente: true, tipoFacturacion: true },
  });
  const total = grupos.length;

  const ultimasFacturas = await prisma.factura.findMany({
    where,
    distinct: ["cliente", "tipoFacturacion"],
    orderBy: [{ fechaFacturacion: "desc" }],
    select: {
      cliente: true,
      tipoFacturacion: true,
      pssr: true,
      fechaFacturacion: true,
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  if (ultimasFacturas.length === 0) {
    return { total, page, pageSize, data: [] };
  }

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
  const seguimientoMap = new Map(
    seguimientos.map((s) => [`${s.cliente}::${s.tipoFacturacion}`, s])
  );

  const data = ultimasFacturas.map((f) => {
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

  return { total, page, pageSize, data };
}

export async function listFiltrosSeguimiento(requesterRol: Rol, requesterNombreCompleto: string) {
  const asesorFiltro: Prisma.StringNullableFilter | undefined =
    requesterRol === Rol.ASESOR ? { equals: requesterNombreCompleto, mode: "insensitive" } : undefined;

  const [asesores, tipos] = await Promise.all([
    prisma.factura.findMany({
      where: { pssr: asesorFiltro ? { ...asesorFiltro, not: null } : { not: null } },
      distinct: ["pssr"],
      select: { pssr: true },
      orderBy: { pssr: "asc" },
    }),
    prisma.factura.findMany({
      where: { tipoFacturacion: { not: null }, ...(asesorFiltro ? { pssr: asesorFiltro } : {}) },
      distinct: ["tipoFacturacion"],
      select: { tipoFacturacion: true },
      orderBy: { tipoFacturacion: "asc" },
    }),
  ]);

  return {
    asesores: asesores.map((a) => a.pssr).filter((v): v is string => !!v),
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
    where: { cliente, tipoFacturacion },
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
