-- DropIndex
DROP INDEX "cliente_seguimientos_cliente_tipoFacturacion_key";

-- AlterTable
ALTER TABLE "cliente_seguimientos" DROP COLUMN "updatedAt",
ALTER COLUMN "fechaSeguimiento" SET NOT NULL;

-- CreateIndex
CREATE INDEX "cliente_seguimientos_cliente_tipoFacturacion_idx" ON "cliente_seguimientos"("cliente", "tipoFacturacion");

