// Script de una sola vez: calcula claveDedupe (cliente + factura + fechaFacturacion +
// tipoFacturacion normalizados) para las filas de Factura que ya existían antes de este cambio y
// todavía no la tienen. Sin esto, una recarga futura del Excel no detectaría que esas filas
// antiguas coinciden con las nuevas (porque su claveDedupe quedaría en null). Usa exactamente la
// misma función que usa el parser de Excel (src/utils/dedupeKey.ts), para garantizar resultados
// idénticos. Es idempotente: solo toca filas con claveDedupe = null.
//
// Uso: npx tsx prisma/backfillClaveDedupeFacturas.ts
import { Prisma, PrismaClient } from "@prisma/client";
import { computeClaveDedupe } from "../src/utils/dedupeKey";

const prisma = new PrismaClient();
const CHUNK = 1000;

async function main() {
  const rows = await prisma.factura.findMany({
    where: { claveDedupe: null },
    select: { id: true, cliente: true, factura: true, fechaFacturacion: true, tipoFacturacion: true },
  });
  console.log(`Filas sin claveDedupe: ${rows.length}`);

  const updates = rows
    .map((r) => ({
      id: r.id,
      clave: computeClaveDedupe(r.cliente, r.factura, r.fechaFacturacion, r.tipoFacturacion),
    }))
    .filter((u): u is { id: string; clave: string } => !!u.clave);

  console.log(`Filas con los 4 componentes presentes (se les asigna claveDedupe): ${updates.length}`);
  console.log(`Filas sin los 4 componentes (quedan en null, nunca compiten por dedup): ${rows.length - updates.length}`);

  let actualizadas = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    const values = Prisma.join(chunk.map((u) => Prisma.sql`(${u.id}::text, ${u.clave}::text)`));
    const result = await prisma.$executeRaw`
      UPDATE facturas AS f
      SET "claveDedupe" = v.clave
      FROM (VALUES ${values}) AS v(id, clave)
      WHERE f.id = v.id
    `;
    actualizadas += Number(result);
    console.log(`Progreso: ${Math.min(i + CHUNK, updates.length)}/${updates.length}`);
  }

  console.log(`Total actualizadas: ${actualizadas}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
