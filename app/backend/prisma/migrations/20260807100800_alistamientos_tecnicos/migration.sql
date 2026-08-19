-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'TECNICO_SERVICIO';

-- CreateTable
CREATE TABLE "tecnicos" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "cargo" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tecnicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacidades_tecnico" (
    "id" TEXT NOT NULL,
    "tecnicoId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "capacidadDiaria" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capacidades_tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tecnicos_userId_key" ON "tecnicos"("userId");

-- CreateIndex
CREATE INDEX "tecnicos_activo_idx" ON "tecnicos"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "capacidades_tecnico_tecnicoId_mes_key" ON "capacidades_tecnico"("tecnicoId", "mes");

-- AddForeignKey
ALTER TABLE "tecnicos" ADD CONSTRAINT "tecnicos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacidades_tecnico" ADD CONSTRAINT "capacidades_tecnico_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "tecnicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
