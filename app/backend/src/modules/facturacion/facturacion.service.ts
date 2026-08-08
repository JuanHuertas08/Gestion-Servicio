import { prisma } from "../../config/prisma";
import { parseFacturacionWorkbook } from "./facturacion.parser";
import { ModuloImportacion, EstadoImportacion } from "@prisma/client";
import { calcularProximaFechaSeguimiento, getDiasSeguimientoMap } from "./parametrosSeguimiento";

export {
  listParametrosSeguimiento,
  updateParametrosSeguimiento,
  type UpdateParametrosSeguimientoInput,
} from "./parametrosSeguimiento";

const BATCH_SIZE = 500;

export async function importFacturacion(params: {
  buffer: Buffer;
  nombreArchivo: string;
  subidoPorId: string;
}) {
  const { buffer, nombreArchivo, subidoPorId } = params;
  const { rows, headerErrors } = parseFacturacionWorkbook(buffer);

  if (headerErrors.length > 0) {
    const batch = await prisma.importBatch.create({
      data: {
        modulo: ModuloImportacion.FACTURACION,
        nombreArchivo,
        subidoPorId,
        estado: EstadoImportacion.FALLIDO,
        errores: headerErrors,
      },
    });
    return { batch, headerErrors };
  }

  const batch = await prisma.importBatch.create({
    data: {
      modulo: ModuloImportacion.FACTURACION,
      nombreArchivo,
      subidoPorId,
      filasTotal: rows.length,
      estado: EstadoImportacion.PROCESANDO,
    },
  });

  const rowErrors: { fila: number; errores: string[] }[] = [];

  const validRows = rows.filter((r) => {
    if (r.errors.length > 0) {
      rowErrors.push({ fila: r.rowNumber, errores: r.errors });
      return false;
    }
    return true;
  });

  try {
    const existentes = await prisma.factura.findMany({
      where: {
        OR: validRows.map((r) => ({
          factura: r.data.factura as string,
          pedido: r.data.pedido as string,
        })),
      },
      select: { factura: true, pedido: true },
    });
    const existentesSet = new Set(existentes.map((e) => `${e.factura}::${e.pedido}`));

    let nuevas = 0;
    let actualizadas = 0;

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const chunk = validRows.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        chunk.map((r) => {
          const data = r.data as Record<string, unknown>;
          return prisma.factura.upsert({
            where: {
              factura_pedido: {
                factura: data.factura as string,
                pedido: data.pedido as string,
              },
            },
            create: {
              ...(data as any),
              importBatchId: batch.id,
              subidoPorId,
            },
            update: {
              ...(data as any),
              importBatchId: batch.id,
              subidoPorId,
            },
          });
        })
      );
      chunk.forEach((r) => {
        const key = `${r.data.factura}::${r.data.pedido}`;
        if (existentesSet.has(key)) actualizadas++;
        else nuevas++;
      });
    }

    const estadoFinal =
      rowErrors.length > 0
        ? EstadoImportacion.COMPLETADO_CON_ERRORES
        : EstadoImportacion.COMPLETADO;

    const updatedBatch = await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        filasNuevas: nuevas,
        filasActualizadas: actualizadas,
        filasError: rowErrors.length,
        estado: estadoFinal,
        errores: rowErrors.length > 0 ? rowErrors : undefined,
      },
    });

    return { batch: updatedBatch, headerErrors: [] as string[] };
  } catch (err) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        estado: EstadoImportacion.FALLIDO,
        errores: [{ error: err instanceof Error ? err.message : "Error desconocido durante la importación" }],
      },
    });
    throw err;
  }
}

export interface ListFacturasParams {
  page: number;
  pageSize: number;
  centro?: string;
  marca?: string;
  pssr?: string;
  cliente?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export async function listFacturas(params: ListFacturasParams) {
  const { page, pageSize, centro, marca, pssr, cliente, fechaDesde, fechaHasta } = params;

  const where = {
    ...(centro ? { centro } : {}),
    ...(marca ? { marca } : {}),
    ...(pssr ? { pssr: { contains: pssr, mode: "insensitive" as const } } : {}),
    ...(cliente ? { cliente: { contains: cliente, mode: "insensitive" as const } } : {}),
    ...(fechaDesde || fechaHasta
      ? {
          fechaFacturacion: {
            ...(fechaDesde ? { gte: fechaDesde } : {}),
            ...(fechaHasta ? { lte: fechaHasta } : {}),
          },
        }
      : {}),
  };

  const [total, facturas, diasPorTipo] = await Promise.all([
    prisma.factura.count({ where }),
    prisma.factura.findMany({
      where,
      orderBy: { fechaFacturacion: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    getDiasSeguimientoMap(),
  ]);

  const data = facturas.map((f) => ({
    ...f,
    proximaFechaSeguimiento: calcularProximaFechaSeguimiento(
      f.fechaFacturacion,
      f.tipoFacturacion,
      diasPorTipo
    ),
  }));

  return { total, page, pageSize, data };
}

export async function listImportBatches(modulo: ModuloImportacion) {
  return prisma.importBatch.findMany({
    where: { modulo },
    orderBy: { createdAt: "desc" },
    include: { subidoPor: { select: { nombres: true, apellidos: true } } },
    take: 50,
  });
}
