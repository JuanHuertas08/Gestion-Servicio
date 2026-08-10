-- CreateTable
CREATE TABLE "asesores" (
    "id" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "numeroDocumento" TEXT,
    "correo" TEXT,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asesores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asesores_nombreCompleto_key" ON "asesores"("nombreCompleto");

-- CreateIndex
CREATE UNIQUE INDEX "asesores_userId_key" ON "asesores"("userId");

-- AddForeignKey
ALTER TABLE "asesores" ADD CONSTRAINT "asesores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

