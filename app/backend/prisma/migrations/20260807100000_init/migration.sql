-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'ASESOR', 'CONSULTA');

-- CreateEnum
CREATE TYPE "AccionAuditoria" AS ENUM ('CREAR', 'EDITAR', 'INACTIVAR', 'REACTIVAR', 'LOGIN', 'CAMBIO_PASSWORD');

-- CreateEnum
CREATE TYPE "ModuloImportacion" AS ENUM ('FACTURACION', 'PROYECCION');

-- CreateEnum
CREATE TYPE "EstadoImportacion" AS ENUM ('PROCESANDO', 'COMPLETADO', 'COMPLETADO_CON_ERRORES', 'FALLIDO');

-- CreateEnum
CREATE TYPE "EstadoSeguimiento" AS ENUM ('PENDIENTE', 'CONTACTADO', 'COMPLETADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "accion" "AccionAuditoria" NOT NULL,
    "entidad" TEXT NOT NULL,
    "cambios" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "modulo" "ModuloImportacion" NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "filasTotal" INTEGER NOT NULL DEFAULT 0,
    "filasNuevas" INTEGER NOT NULL DEFAULT 0,
    "filasActualizadas" INTEGER NOT NULL DEFAULT 0,
    "filasError" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoImportacion" NOT NULL DEFAULT 'PROCESANDO',
    "errores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "anioMesNatural" TEXT,
    "centro" TEXT,
    "centro2" TEXT,
    "centroBeneficio" TEXT,
    "pssr" TEXT,
    "motivoPedido" TEXT,
    "pedido" TEXT NOT NULL,
    "marca" TEXT,
    "cliente" TEXT,
    "factura" TEXT NOT NULL,
    "fechaDocumento" TIMESTAMP(3),
    "fechaFacturacion" TIMESTAMP(3),
    "piezas" DECIMAL(18,4),
    "ventaNeta" DECIMAL(18,4),
    "grossMarginUsd" DECIMAL(18,4),
    "repuestos" DECIMAL(18,4),
    "margenPct" DECIMAL(9,6),
    "manoObra" DECIMAL(18,4),
    "trabajosTerceros" DECIMAL(18,4),
    "insumos" DECIMAL(18,4),
    "descuento" DECIMAL(18,4),
    "descuentoPct" DECIMAL(9,6),
    "anio" INTEGER,
    "mes" TEXT,
    "pctRepuestos" DECIMAL(9,6),
    "pctManoObra" DECIMAL(9,6),
    "unidad" TEXT,
    "tipoDoc" TEXT,
    "causalNc" TEXT,
    "anioCompra" INTEGER,
    "mesCompra" INTEGER,
    "fechaPrimeraCompra" TIMESTAMP(3),
    "primerMesCompra" TEXT,
    "esquemaServicio" TEXT,
    "tipoFacturacion" TEXT,
    "ultimaFactura" TIMESTAMP(3),
    "seguimientoFecha" TIMESTAMP(3),
    "importBatchId" TEXT NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_seguimientos" (
    "id" TEXT NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "asesorId" TEXT,
    "asesorNombreOriginal" TEXT,
    "fechaEstimada" TIMESTAMP(3),
    "estado" "EstadoSeguimiento" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "importBatchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_seguimientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_numeroDocumento_key" ON "users"("numeroDocumento");

-- CreateIndex
CREATE INDEX "audit_logs_targetUserId_idx" ON "audit_logs"("targetUserId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "facturas_pssr_idx" ON "facturas"("pssr");

-- CreateIndex
CREATE INDEX "facturas_fechaFacturacion_idx" ON "facturas"("fechaFacturacion");

-- CreateIndex
CREATE INDEX "facturas_cliente_idx" ON "facturas"("cliente");

-- CreateIndex
CREATE INDEX "facturas_centro_idx" ON "facturas"("centro");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_factura_pedido_key" ON "facturas"("factura", "pedido");

-- CreateIndex
CREATE INDEX "cliente_seguimientos_asesorId_idx" ON "cliente_seguimientos"("asesorId");

-- CreateIndex
CREATE INDEX "cliente_seguimientos_estado_idx" ON "cliente_seguimientos"("estado");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_seguimientos" ADD CONSTRAINT "cliente_seguimientos_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_seguimientos" ADD CONSTRAINT "cliente_seguimientos_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
