-- CreateEnum
CREATE TYPE "EstadoSolicitudServicio" AS ENUM ('PENDIENTE', 'PROGRAMADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "solicitudes_servicio" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "ordenTrabajoId" TEXT NOT NULL,
    "fechaSolicitada" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoSolicitudServicio" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_servicio_numero_key" ON "solicitudes_servicio"("numero");

-- CreateIndex
CREATE INDEX "solicitudes_servicio_ordenTrabajoId_idx" ON "solicitudes_servicio"("ordenTrabajoId");

-- CreateIndex
CREATE INDEX "solicitudes_servicio_estado_idx" ON "solicitudes_servicio"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_servicio_fechaSolicitada_idx" ON "solicitudes_servicio"("fechaSolicitada");

-- AddForeignKey
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
