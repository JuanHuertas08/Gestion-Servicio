import { prisma } from "../../config/prisma";
import { parseFacturacionWorkbook } from "./facturacion.parser";
import { ModuloImportacion, EstadoImportacion } from "@prisma/client";
import { calcularProximaFechaSeguimiento, getDiasSeguimientoMap } from "./parametrosSeguimiento";
import { registrarAsesoresDesdeFacturacion } from "../asesores/asesores.service";

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
    // Llave combinada (cliente + factura + fechaFacturacion + tipoFacturacion) por fila; null si a
    // la fila le falta algún componente (esas filas nunca compiten por "ser la activa" de nada).
    const clavesEnArchivo = Array.from(
      new Set(
        validRows
          .map((r) => (r.data as Record<string, unknown>).claveDedupe as string | null)
          .filter((v): v is string => !!v)
      )
    );

    const activasPrevias = clavesEnArchivo.length
      ? await prisma.factura.findMany({
          where: { activo: true, claveDedupe: { in: clavesEnArchivo } },
          select: { claveDedupe: true },
        })
      : [];
    const clavesYaActivas = new Set(activasPrevias.map((f) => f.claveDedupe as string));

    if (clavesEnArchivo.length > 0) {
      // Inactivar de una vez todos los activos previos que esta carga va a reemplazar.
      await prisma.factura.updateMany({
        where: { activo: true, claveDedupe: { in: clavesEnArchivo } },
        data: { activo: false },
      });
    }

    // Si la misma llave se repite dentro del propio archivo, solo la última ocurrencia queda
    // activa (las anteriores se insertan directamente como inactivas).
    const ultimoIndicePorClave = new Map<string, number>();
    validRows.forEach((r, i) => {
      const clave = (r.data as Record<string, unknown>).claveDedupe as string | null;
      if (clave) ultimoIndicePorClave.set(clave, i);
    });

    let nuevas = 0;
    let actualizadas = 0;
    validRows.forEach((r) => {
      const clave = (r.data as Record<string, unknown>).claveDedupe as string | null;
      if (clave && clavesYaActivas.has(clave)) actualizadas++;
      else nuevas++;
    });

    // Nunca se actualiza en el sitio: cada carga siempre INSERTA filas nuevas, así se conserva el
    // historial completo (quién quedó activo y qué quedó inactivado, y cuándo).
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const chunk = validRows.slice(i, i + BATCH_SIZE);
      await prisma.factura.createMany({
        data: chunk.map((r, chunkIdx) => {
          const data = r.data as Record<string, unknown>;
          const clave = data.claveDedupe as string | null;
          const esLaActiva = !clave || ultimoIndicePorClave.get(clave) === i + chunkIdx;
          return {
            ...(data as any),
            activo: esLaActiva,
            importBatchId: batch.id,
            subidoPorId,
          };
        }),
      });
    }

    await registrarAsesoresDesdeFacturacion(
      validRows.map((r) => (r.data as Record<string, unknown>).pssr as string | null).filter((v): v is string => !!v)
    );

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
    activo: true,
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
