-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'SERVICIO_ADMIN';

-- AlterTable
ALTER TABLE "solicitudes_servicio" ADD COLUMN     "aprobadoPorId" TEXT,
ADD COLUMN     "fechaAprobacion" TIMESTAMP(3),
ADD COLUMN     "fechaProgramada" TIMESTAMP(3),
ADD COLUMN     "horaProgramada" TEXT,
ADD COLUMN     "tecnicoId" TEXT;

-- CreateIndex
CREATE INDEX "solicitudes_servicio_tecnicoId_idx" ON "solicitudes_servicio"("tecnicoId");

-- CreateIndex
CREATE INDEX "solicitudes_servicio_fechaProgramada_idx" ON "solicitudes_servicio"("fechaProgramada");

-- AddForeignKey
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "tecnicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
