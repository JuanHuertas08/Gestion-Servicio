-- CreateEnum
CREATE TYPE "EstadoOrdenTrabajo" AS ENUM ('RADICADO', 'PROGRAMADO', 'EN_PROCESO', 'CERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PrioridadOrdenTrabajo" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "TipoServicioOrdenTrabajo" AS ENUM ('PREVENTIVO', 'CORRECTIVO', 'PREVENTIVO_CORRECTIVO', 'DIAGNOSTICO', 'CORTESIA', 'GARANTIA', 'ENTREGA');

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL,
    "cliente" TEXT NOT NULL,
    "clienteNit" TEXT,
    "numeroClienteSap" TEXT,
    "asesorPssr" TEXT NOT NULL,
    "valor" DECIMAL(18,2),
    "horasServicio" DECIMAL(10,2),
    "horasDesplazamiento" DECIMAL(10,2),
    "ordenTrabajoNumero" TEXT,
    "tipoServicio" "TipoServicioOrdenTrabajo" NOT NULL,
    "descripcionServicio" TEXT,
    "sucursal" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "departamento" TEXT,
    "personaContacto" TEXT,
    "correoContacto" TEXT,
    "telefonoContacto" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "serialMaquina" TEXT,
    "coordinadorAltura" BOOLEAN NOT NULL DEFAULT false,
    "equipoApoyo" BOOLEAN NOT NULL DEFAULT false,
    "fechaSugerida" TIMESTAMP(3),
    "fechaProgramacionReal" TIMESTAMP(3),
    "horaServicio" TEXT,
    "estado" "EstadoOrdenTrabajo" NOT NULL DEFAULT 'RADICADO',
    "prioridad" "PrioridadOrdenTrabajo" NOT NULL DEFAULT 'MEDIA',
    "tecnicoAsignado" TEXT,
    "codigoSap" TEXT,
    "fechaCierre" TIMESTAMP(3),
    "observaciones" TEXT,
    "programadorSegunSede" TEXT,
    "unidadIntervenirTaller" BOOLEAN NOT NULL DEFAULT false,
    "tipoTrabajo" TEXT,
    "fechaTrasladoTaller" TIMESTAMP(3),
    "reporteClick" BOOLEAN NOT NULL DEFAULT false,
    "creadoPorId" TEXT NOT NULL,
    "actualizadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_numero_key" ON "ordenes_trabajo"("numero");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_cliente_idx" ON "ordenes_trabajo"("cliente");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_asesorPssr_idx" ON "ordenes_trabajo"("asesorPssr");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_estado_idx" ON "ordenes_trabajo"("estado");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_fechaSolicitud_idx" ON "ordenes_trabajo"("fechaSolicitud");

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
