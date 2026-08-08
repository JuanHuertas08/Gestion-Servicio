-- CreateTable
CREATE TABLE "parametros_seguimiento" (
    "id" TEXT NOT NULL,
    "tipoFacturacion" TEXT NOT NULL,
    "diasSeguimiento" INTEGER NOT NULL,
    "actualizadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parametros_seguimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parametros_seguimiento_tipoFacturacion_key" ON "parametros_seguimiento"("tipoFacturacion");

-- AddForeignKey
ALTER TABLE "parametros_seguimiento" ADD CONSTRAINT "parametros_seguimiento_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

