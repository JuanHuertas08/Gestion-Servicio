import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { HttpError } from "../../middleware/errorHandler";
import { AccionAuditoria } from "@prisma/client";

export async function login(numeroDocumento: string, password: string) {
  const user = await prisma.user.findUnique({ where: { numeroDocumento } });
  if (!user || !user.activo) {
    throw new HttpError(401, "Credenciales inválidas");
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Credenciales inválidas");
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      targetUserId: user.id,
      accion: AccionAuditoria.LOGIN,
      entidad: "User",
    },
  });

  const token = jwt.sign(
    { sub: user.id, rol: user.rol, numeroDocumento: user.numeroDocumento },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as any }
  );

  return { token, user };
}

export async function changePassword(userId: string, actualPassword: string, nuevaPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "Usuario no encontrado");

  const valid = await bcrypt.compare(actualPassword, user.passwordHash);
  if (!valid) throw new HttpError(400, "La contraseña actual no es correcta");

  const passwordHash = await bcrypt.hash(nuevaPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      targetUserId: userId,
      accion: AccionAuditoria.CAMBIO_PASSWORD,
      entidad: "User",
    },
  });
}
