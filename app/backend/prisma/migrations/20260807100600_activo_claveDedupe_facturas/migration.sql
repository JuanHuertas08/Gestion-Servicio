-- DropIndex
DROP INDEX "facturas_factura_pedido_key";

-- AlterTable
ALTER TABLE "facturas" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "claveDedupe" TEXT;

-- CreateIndex
CREATE INDEX "facturas_activo_idx" ON "facturas"("activo");

-- CreateIndex
CREATE INDEX "facturas_claveDedupe_idx" ON "facturas"("claveDedupe");

-- Índice único parcial: a lo sumo un registro ACTIVO por claveDedupe. Prisma no puede expresar
-- índices parciales en el schema, así que se agrega a mano (no lo toca `prisma migrate diff`).
CREATE UNIQUE INDEX "facturas_claveDedupe_activo_key" ON "facturas"("claveDedupe") WHERE "activo" = true AND "claveDedupe" IS NOT NULL;
