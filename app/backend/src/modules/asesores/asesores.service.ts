import { prisma } from "../../config/prisma";
import { Rol } from "@prisma/client";

/**
 * Registra o vincula el asesor en el maestro cuando se crea/edita un usuario con rol Asesor.
 * Si ya existía un registro con ese nombre (por ejemplo, creado automáticamente al importar
 * Facturación) lo vincula a la cuenta de usuario en vez de duplicarlo.
 */
export async function registrarAsesorDeUsuario(params: {
  userId: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  correo: string;
  telefono: string;
}) {
  const { userId, nombres, apellidos, numeroDocumento, correo, telefono } = params;
  const nombreCompleto = `${nombres} ${apellidos}`;

  const existentePorNombre = await prisma.asesor.findUnique({ where: { nombreCompleto } });

  if (existentePorNombre && existentePorNombre.userId && existentePorNombre.userId !== userId) {
    // Nombre coincide con el de otro asesor ya vinculado a una cuenta distinta: no pisar ese
    // vínculo, solo asegurar que exista un registro para este usuario (con nombre + sufijo).
    await prisma.asesor.upsert({
      where: { userId },
      create: { nombreCompleto: `${nombreCompleto} (${numeroDocumento})`, numeroDocumento, correo, telefono, userId, activo: true },
      update: { correo, telefono, activo: true },
    });
    return;
  }

  await prisma.asesor.upsert({
    where: { nombreCompleto },
    create: { nombreCompleto, numeroDocumento, correo, telefono, userId, activo: true },
    update: { numeroDocumento, correo, telefono, userId, activo: true },
  });
}

export async function desvincularAsesorDeUsuario(userId: string) {
  await prisma.asesor.updateMany({ where: { userId }, data: { userId: null } });
}

export async function setAsesorActivoPorUsuario(userId: string, activo: boolean) {
  await prisma.asesor.updateMany({ where: { userId }, data: { activo } });
}

/**
 * Da de alta en el maestro cualquier PSSR de la Facturación importada que todavía no esté
 * registrado (sin cuenta de usuario vinculada). No sobrescribe registros existentes.
 */
export async function registrarAsesoresDesdeFacturacion(pssrValues: string[]) {
  const nombres = Array.from(new Set(pssrValues.filter((v): v is string => !!v && v.trim().length > 0)));
  if (nombres.length === 0) return;

  const existentes = await prisma.asesor.findMany({
    where: { nombreCompleto: { in: nombres } },
    select: { nombreCompleto: true },
  });
  const existentesSet = new Set(existentes.map((e) => e.nombreCompleto));
  const nuevos = nombres.filter((n) => !existentesSet.has(n));
  if (nuevos.length === 0) return;

  await prisma.asesor.createMany({
    data: nuevos.map((nombreCompleto) => ({ nombreCompleto })),
    skipDuplicates: true,
  });
}

export interface ListAsesoresParams {
  requesterRol: Rol;
  requesterNombreCompleto: string;
  soloActivos?: boolean;
}

export async function listAsesores(params: ListAsesoresParams) {
  const { requesterRol, requesterNombreCompleto, soloActivos = true } = params;

  const where =
    requesterRol === Rol.ASESOR
      ? { nombreCompleto: requesterNombreCompleto }
      : soloActivos
        ? { activo: true }
        : {};

  return prisma.asesor.findMany({
    where,
    orderBy: { nombreCompleto: "asc" },
    select: { id: true, nombreCompleto: true, activo: true, correo: true, telefono: true, userId: true },
  });
}
