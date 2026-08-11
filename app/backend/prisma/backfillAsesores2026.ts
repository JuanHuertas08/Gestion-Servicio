// Script de una sola vez: puebla el maestro de Asesores con TODOS los PSSR distintos que
// aparecen en la Facturación ya cargada, marcándolos Activo salvo que no tengan ninguna factura
// en el año más reciente presente en los datos (en cuyo caso quedan Inactivo). El "año más
// reciente" se calcula dinámicamente (MAX(anio) en Factura) en vez de fijarlo en 2026, porque al
// momento de escribir este script la Facturación cargada solo llega hasta 2025 — así el criterio
// sigue siendo válido aunque se recargue el Excel más adelante con años más nuevos.
//
// Es idempotente (se puede volver a ejecutar sin duplicar ni dañar nada) y NO toca asesores con
// una cuenta de usuario vinculada (userId), ya que esos se administran desde Usuarios.
//
// Uso: npx tsx prisma/backfillAsesores2026.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const { _max } = await prisma.factura.aggregate({ _max: { anio: true } });
  const anioMasReciente = _max.anio;
  if (anioMasReciente === null) {
    console.log("No hay facturas con año registrado; no se puede aplicar el criterio de actividad. Abortando.");
    return;
  }
  console.log(`Año más reciente presente en Facturación: ${anioMasReciente}`);

  const filas = await prisma.factura.findMany({
    where: { pssr: { not: null } },
    select: { pssr: true, anio: true },
  });

  const activoPorAsesor = new Map<string, boolean>();
  for (const fila of filas) {
    const nombre = fila.pssr?.trim();
    if (!nombre) continue;
    const yaActivo = activoPorAsesor.get(nombre) ?? false;
    activoPorAsesor.set(nombre, yaActivo || fila.anio === anioMasReciente);
  }

  console.log(`PSSR distintos encontrados en Facturación: ${activoPorAsesor.size}`);

  let creados = 0;
  let actualizados = 0;
  let omitidosPorCuentaVinculada = 0;
  let sinCambios = 0;

  for (const [nombreCompleto, activo] of activoPorAsesor) {
    const existente = await prisma.asesor.findUnique({ where: { nombreCompleto } });

    if (!existente) {
      await prisma.asesor.create({ data: { nombreCompleto, activo } });
      creados++;
      continue;
    }

    if (existente.userId) {
      omitidosPorCuentaVinculada++;
      continue;
    }

    if (existente.activo !== activo) {
      await prisma.asesor.update({ where: { id: existente.id }, data: { activo } });
      actualizados++;
    } else {
      sinCambios++;
    }
  }

  console.log(
    `Creados: ${creados} | Actualizados: ${actualizados} | Sin cambios: ${sinCambios} | ` +
      `Omitidos (cuenta de usuario vinculada): ${omitidosPorCuentaVinculada}`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
