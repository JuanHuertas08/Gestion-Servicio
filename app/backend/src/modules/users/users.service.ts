import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { AccionAuditoria, Rol, Prisma } from "@prisma/client";
import {
  desvincularAsesorDeUsuario,
  registrarAsesorDeUsuario,
  setAsesorActivoPorUsuario,
} from "../asesores/asesores.service";

export interface CreateUserInput {
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  rol: Rol;
  password: string;
}

export async function createUser(input: CreateUserInput, actorUserId: string) {
  const existing = await prisma.user.findUnique({ where: { numeroDocumento: input.numeroDocumento } });
  if (existing) {
    throw new HttpError(409, "Ya existe un usuario con ese número de documento");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      nombres: input.nombres,
      apellidos: input.apellidos,
      numeroDocumento: input.numeroDocumento,
      correo: input.correo,
      telefono: input.telefono,
      rol: input.rol,
      passwordHash,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      targetUserId: user.id,
      accion: AccionAuditoria.CREAR,
      entidad: "User",
      cambios: {
        nombres: user.nombres,
        apellidos: user.apellidos,
        numeroDocumento: user.numeroDocumento,
        correo: user.correo,
        telefono: user.telefono,
        rol: user.rol,
      },
    },
  });

  if (user.rol === Rol.ASESOR) {
    await registrarAsesorDeUsuario({
      userId: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      numeroDocumento: user.numeroDocumento,
      correo: user.correo,
      telefono: user.telefono,
    });
  }

  return user;
}

export interface UpdateUserInput {
  nombres?: string;
  apellidos?: string;
  correo?: string;
  telefono?: string;
  rol?: Rol;
  password?: string;
}

export async function updateUser(id: string, input: UpdateUserInput, actorUserId: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Usuario no encontrado");

  const data: Record<string, unknown> = {};
  const cambios: Record<string, { antes: unknown; despues: unknown }> = {};

  (["nombres", "apellidos", "correo", "telefono", "rol"] as const).forEach((field) => {
    const value = input[field];
    if (value !== undefined && value !== existing[field]) {
      cambios[field] = { antes: existing[field], despues: value };
      data[field] = value;
    }
  });

  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 10);
    cambios.password = { antes: "***", despues: "***" };
  }

  if (Object.keys(data).length === 0) {
    return existing;
  }

  const user = await prisma.user.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      targetUserId: user.id,
      accion: AccionAuditoria.EDITAR,
      entidad: "User",
      cambios: cambios as Prisma.InputJsonValue,
    },
  });

  if (user.rol === Rol.ASESOR) {
    await registrarAsesorDeUsuario({
      userId: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      numeroDocumento: user.numeroDocumento,
      correo: user.correo,
      telefono: user.telefono,
    });
  } else if (existing.rol === Rol.ASESOR) {
    // Dejó de ser Asesor: se desvincula del maestro pero no se borra el registro histórico.
    await desvincularAsesorDeUsuario(user.id);
  }

  return user;
}

export async function setUserActivo(id: string, activo: boolean, actorUserId: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Usuario no encontrado");
  if (id === actorUserId && !activo) {
    throw new HttpError(400, "No puede inactivar su propio usuario");
  }

  const user = await prisma.user.update({ where: { id }, data: { activo } });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      targetUserId: user.id,
      accion: activo ? AccionAuditoria.REACTIVAR : AccionAuditoria.INACTIVAR,
      entidad: "User",
    },
  });

  if (user.rol === Rol.ASESOR) {
    await setAsesorActivoPorUsuario(user.id, activo);
  }

  return user;
}

export interface ListUsersParams {
  page: number;
  pageSize: number;
  busqueda?: string;
  rol?: Rol;
  activo?: boolean;
}

export async function listUsers(params: ListUsersParams) {
  const { page, pageSize, busqueda, rol, activo } = params;
  const where = {
    ...(rol ? { rol } : {}),
    ...(activo !== undefined ? { activo } : {}),
    ...(busqueda
      ? {
          OR: [
            { nombres: { contains: busqueda, mode: "insensitive" as const } },
            { apellidos: { contains: busqueda, mode: "insensitive" as const } },
            { numeroDocumento: { contains: busqueda, mode: "insensitive" as const } },
            { correo: { contains: busqueda, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        numeroDocumento: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return { total, page, pageSize, data };
}

export async function listAuditLogs(targetUserId?: string) {
  return prisma.auditLog.findMany({
    where: targetUserId ? { targetUserId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      actor: { select: { nombres: true, apellidos: true, numeroDocumento: true } },
      target: { select: { nombres: true, apellidos: true, numeroDocumento: true } },
    },
  });
}
