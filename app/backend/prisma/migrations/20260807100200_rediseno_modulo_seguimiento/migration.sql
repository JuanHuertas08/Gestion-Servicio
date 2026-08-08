-- AlterEnum
BEGIN;
CREATE TYPE "EstadoSeguimiento_new" AS ENUM ('PENDIENTE', 'REALIZADO');
ALTER TABLE "cliente_seguimientos" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "cliente_seguimientos" ALTER COLUMN "estado" TYPE "EstadoSeguimiento_new" USING ("estado"::text::"EstadoSeguimiento_new");
ALTER TYPE "EstadoSeguimiento" RENAME TO "EstadoSeguimiento_old";
ALTER TYPE "EstadoSeguimiento_new" RENAME TO "EstadoSeguimiento";
DROP TYPE "EstadoSeguimiento_old";
ALTER TABLE "cliente_seguimientos" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ModuloImportacion_new" AS ENUM ('FACTURACION');
ALTER TABLE "import_batches" ALTER COLUMN "modulo" TYPE "ModuloImportacion_new" USING ("modulo"::text::"ModuloImportacion_new");
ALTER TYPE "ModuloImportacion" RENAME TO "ModuloImportacion_old";
ALTER TYPE "ModuloImportacion_new" RENAME TO "ModuloImportacion";
DROP TYPE "ModuloImportacion_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "cliente_seguimientos" DROP CONSTRAINT "cliente_seguimientos_asesorId_fkey";

-- DropForeignKey
ALTER TABLE "cliente_seguimientos" DROP CONSTRAINT "cliente_seguimientos_importBatchId_fkey";

-- DropIndex
DROP INDEX "cliente_seguimientos_asesorId_idx";

-- AlterTable
ALTER TABLE "cliente_seguimientos" DROP COLUMN "asesorId",
DROP COLUMN "asesorNombreOriginal",
DROP COLUMN "clienteNombre",
DROP COLUMN "fechaEstimada",
DROP COLUMN "importBatchId",
ADD COLUMN     "cliente" TEXT NOT NULL,
ADD COLUMN     "fechaSeguimiento" TIMESTAMP(3),
ADD COLUMN     "registradoPorId" TEXT,
ADD COLUMN     "tipoFacturacion" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "cliente_seguimientos_cliente_tipoFacturacion_key" ON "cliente_seguimientos"("cliente", "tipoFacturacion");

-- AddForeignKey
ALTER TABLE "cliente_seguimientos" ADD CONSTRAINT "cliente_seguimientos_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

