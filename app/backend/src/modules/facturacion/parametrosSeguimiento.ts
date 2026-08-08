import { prisma } from "../../config/prisma";
import { HttpError } from "../../middleware/errorHandler";

export async function getDiasSeguimientoMap(): Promise<Map<string, number>> {
  const parametros = await prisma.parametroSeguimiento.findMany();
  return new Map(parametros.map((p) => [p.tipoFacturacion, p.diasSeguimiento]));
}

export function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

export function calcularProximaFechaSeguimiento(
  fechaBase: Date | null,
  tipoFacturacion: string | null,
  diasPorTipo: Map<string, number>
): Date | null {
  if (!fechaBase || !tipoFacturacion) return null;
  const dias = diasPorTipo.get(tipoFacturacion);
  if (dias === undefined) return null;
  return sumarDias(fechaBase, dias);
}

export async function listParametrosSeguimiento() {
  return prisma.parametroSeguimiento.findMany({ orderBy: { tipoFacturacion: "asc" } });
}

export interface UpdateParametrosSeguimientoInput {
  parametros: { tipoFacturacion: string; diasSeguimiento: number }[];
  actualizadoPorId: string;
}

export async function updateParametrosSeguimiento(input: UpdateParametrosSeguimientoInput) {
  const { parametros, actualizadoPorId } = input;
  for (const p of parametros) {
    if (!Number.isInteger(p.diasSeguimiento) || p.diasSeguimiento < 0) {
      throw new HttpError(400, `Días de seguimiento inválidos para ${p.tipoFacturacion}`);
    }
  }

  await prisma.$transaction(
    parametros.map((p) =>
      prisma.parametroSeguimiento.upsert({
        where: { tipoFacturacion: p.tipoFacturacion },
        create: {
          tipoFacturacion: p.tipoFacturacion,
          diasSeguimiento: p.diasSeguimiento,
          actualizadoPorId,
        },
        update: {
          diasSeguimiento: p.diasSeguimiento,
          actualizadoPorId,
        },
      })
    )
  );

  return listParametrosSeguimiento();
}
