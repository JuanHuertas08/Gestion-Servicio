import bcrypt from "bcryptjs";
import { PrismaClient, Rol } from "@prisma/client";

const prisma = new PrismaClient();

const DIAS_SEGUIMIENTO_DEFAULT: Record<string, number> = {
  REPUESTOS: 30,
  SERVICIO: 90,
  ESTIBADORES: 180,
};

async function seedAdmin() {
  const documento = process.env.SEED_ADMIN_DOCUMENTO ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

  const existing = await prisma.user.findUnique({ where: { numeroDocumento: documento } });
  if (existing) {
    console.log(`El usuario administrador "${documento}" ya existe, no se crea de nuevo.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      nombres: "Administrador",
      apellidos: "Sistema",
      numeroDocumento: documento,
      correo: "admin@controlservicio.local",
      telefono: "0000000000",
      rol: Rol.ADMINISTRADOR,
      passwordHash,
    },
  });

  console.log("Usuario administrador inicial creado:");
  console.log(`  Número de documento (usuario): ${documento}`);
  console.log(`  Contraseña: ${password}`);
  console.log("  -> Cambie esta contraseña después del primer inicio de sesión.");
}

async function seedParametrosSeguimiento() {
  for (const [tipoFacturacion, diasSeguimiento] of Object.entries(DIAS_SEGUIMIENTO_DEFAULT)) {
    await prisma.parametroSeguimiento.upsert({
      where: { tipoFacturacion },
      create: { tipoFacturacion, diasSeguimiento },
      update: {},
    });
  }
  console.log("Parámetros de días de seguimiento por tipo de facturación verificados/creados.");
}

async function main() {
  await seedAdmin();
  await seedParametrosSeguimiento();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
