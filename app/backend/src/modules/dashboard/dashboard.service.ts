import { prisma } from "../../config/prisma";
import { EstadoSeguimiento, Prisma } from "@prisma/client";
import { calcularProximaFechaSeguimiento, getDiasSeguimientoMap } from "../facturacion/parametrosSeguimiento";

export interface DashboardParams {
  anio?: number;
  mes?: number; // 1-12, solo se aplica si también se especifica anio
  asesor?: string; // PSSR / nombre completo del asesor
}

function buildRangoFechas(params: DashboardParams): { gte: Date; lt: Date } | undefined {
  const { anio, mes } = params;
  if (!anio) return undefined;
  if (mes) {
    return {
      gte: new Date(Date.UTC(anio, mes - 1, 1)),
      lt: new Date(Date.UTC(anio, mes, 1)),
    };
  }
  return {
    gte: new Date(Date.UTC(anio, 0, 1)),
    lt: new Date(Date.UTC(anio + 1, 0, 1)),
  };
}

function buildFacturaWhere(params: DashboardParams): Prisma.FacturaWhereInput {
  const rango = buildRangoFechas(params);
  return {
    ...(rango ? { fechaFacturacion: rango } : {}),
    ...(params.asesor ? { pssr: { equals: params.asesor, mode: "insensitive" as const } } : {}),
  };
}

export async function getDashboardKpis(params: DashboardParams) {
  const where = buildFacturaWhere(params);

  const [totales, numFacturas, porAsesor] = await Promise.all([
    prisma.factura.aggregate({
      where,
      _sum: { ventaNeta: true, grossMarginUsd: true },
    }),
    prisma.factura.count({ where }),
    prisma.factura.groupBy({
      by: ["pssr"],
      where,
      _sum: { ventaNeta: true },
      orderBy: { _sum: { ventaNeta: "desc" } },
      take: 5,
    }),
  ]);

  const ventaNeta = totales._sum.ventaNeta ? Number(totales._sum.ventaNeta) : 0;
  const margenUsd = totales._sum.grossMarginUsd ? Number(totales._sum.grossMarginUsd) : 0;

  return {
    ventaNeta,
    margenUsd,
    margenPct: ventaNeta !== 0 ? margenUsd / ventaNeta : 0,
    numFacturas,
    topAsesores: porAsesor.map((a) => ({
      pssr: a.pssr,
      ventaNeta: a._sum.ventaNeta ? Number(a._sum.ventaNeta) : 0,
    })),
  };
}

const MESES_ABREV = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/**
 * Ventas por período: si se indica año, desglosa por mes de ese año (para ver la tendencia
 * dentro del período); si no, desglosa por año (vista panorámica). Ignora el filtro de mes del
 * tablero a propósito: un gráfico de tendencia no tiene sentido colapsado a un solo mes.
 */
export async function getVentasPorPeriodo(anio?: number, asesor?: string) {
  if (anio) {
    const rows = await prisma.$queryRaw<{ mes: number; venta: string | null }[]>`
      SELECT EXTRACT(MONTH FROM "fechaFacturacion")::int AS mes, SUM("ventaNeta") AS venta
      FROM facturas
      WHERE EXTRACT(YEAR FROM "fechaFacturacion") = ${anio}
        AND (${asesor ?? null}::text IS NULL OR "pssr" ILIKE ${asesor ?? ""})
      GROUP BY 1
      ORDER BY 1
    `;
    return rows.map((r) => ({ periodo: MESES_ABREV[r.mes - 1], ventaNeta: Number(r.venta ?? 0) }));
  }

  const rows = await prisma.$queryRaw<{ anio: number; venta: string | null }[]>`
    SELECT EXTRACT(YEAR FROM "fechaFacturacion")::int AS anio, SUM("ventaNeta") AS venta
    FROM facturas
    WHERE "fechaFacturacion" IS NOT NULL
      AND (${asesor ?? null}::text IS NULL OR "pssr" ILIKE ${asesor ?? ""})
    GROUP BY 1
    ORDER BY 1
  `;
  return rows.map((r) => ({ periodo: String(r.anio), ventaNeta: Number(r.venta ?? 0) }));
}

export async function getVentasPorTipoFacturacion(params: DashboardParams) {
  const where: Prisma.FacturaWhereInput = { tipoFacturacion: { not: null }, ...buildFacturaWhere(params) };
  const rows = await prisma.factura.groupBy({
    by: ["tipoFacturacion"],
    where,
    _sum: { ventaNeta: true },
  });
  return rows.map((r) => ({
    tipo: r.tipoFacturacion as string,
    ventaNeta: r._sum.ventaNeta ? Number(r._sum.ventaNeta) : 0,
  }));
}

export async function getVentasPorMarca(params: DashboardParams) {
  const where: Prisma.FacturaWhereInput = { marca: { not: null }, ...buildFacturaWhere(params) };
  const rows = await prisma.factura.groupBy({
    by: ["marca"],
    where,
    _sum: { ventaNeta: true },
    orderBy: { _sum: { ventaNeta: "desc" } },
    take: 8,
  });
  return rows.map((r) => ({
    marca: r.marca as string,
    ventaNeta: r._sum.ventaNeta ? Number(r._sum.ventaNeta) : 0,
  }));
}

/**
 * Indicadores de seguimiento: sobre el mismo universo de (cliente, tipo de facturación) del
 * módulo de Proyección — filtrado por la fecha de la última factura de cada grupo, respetando
 * año/mes/asesor del tablero — calcula cuántos tienen su seguimiento más reciente en estado
 * Realizado, cuántos están pendientes, y de esos pendientes cuántos ya vencieron (fecha de
 * próximo seguimiento proyectada ya pasada). El % de cumplimiento es realizados / total.
 */
export async function getSeguimientoStats(params: DashboardParams) {
  const where: Prisma.FacturaWhereInput = {
    cliente: { not: null },
    tipoFacturacion: { not: null },
    ...buildFacturaWhere(params),
  };

  const ultimasFacturas = await prisma.factura.findMany({
    where,
    distinct: ["cliente", "tipoFacturacion"],
    select: { cliente: true, tipoFacturacion: true, pssr: true, fechaFacturacion: true },
  });

  const vacio = {
    total: 0,
    realizados: 0,
    pendientes: 0,
    vencidos: 0,
    cumplimientoPct: 0,
    porAsesor: [] as { pssr: string; total: number; realizados: number; cumplimientoPct: number }[],
  };
  if (ultimasFacturas.length === 0) return vacio;

  const [seguimientos, diasPorTipo] = await Promise.all([
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

  const hoy = new Date();
  let realizados = 0;
  let vencidos = 0;
  const porAsesorMap = new Map<string, { total: number; realizados: number }>();

  for (const f of ultimasFacturas) {
    const seguimiento = seguimientoMap.get(`${f.cliente}::${f.tipoFacturacion}`);
    const estado = seguimiento?.estado ?? EstadoSeguimiento.PENDIENTE;
    const esRealizado = estado === EstadoSeguimiento.REALIZADO;

    if (esRealizado) {
      realizados++;
    } else {
      const fechaBase = seguimiento?.fechaSeguimiento ?? f.fechaFacturacion;
      const proxima = calcularProximaFechaSeguimiento(fechaBase, f.tipoFacturacion, diasPorTipo);
      if (proxima && proxima < hoy) vencidos++;
    }

    const asesorKey = f.pssr ?? "(sin asesor)";
    const entry = porAsesorMap.get(asesorKey) ?? { total: 0, realizados: 0 };
    entry.total++;
    if (esRealizado) entry.realizados++;
    porAsesorMap.set(asesorKey, entry);
  }

  const total = ultimasFacturas.length;
  const porAsesor = Array.from(porAsesorMap.entries())
    .map(([pssr, v]) => ({
      pssr,
      total: v.total,
      realizados: v.realizados,
      cumplimientoPct: v.total > 0 ? v.realizados / v.total : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    total,
    realizados,
    pendientes: total - realizados,
    vencidos,
    cumplimientoPct: total > 0 ? realizados / total : 0,
    porAsesor,
  };
}

export async function getDashboardFiltros() {
  const rows = await prisma.$queryRaw<{ anio: number }[]>`
    SELECT DISTINCT EXTRACT(YEAR FROM "fechaFacturacion")::int AS anio
    FROM facturas
    WHERE "fechaFacturacion" IS NOT NULL
    ORDER BY anio DESC
  `;
  return { anios: rows.map((r) => r.anio) };
}
