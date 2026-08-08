import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "./errorHandler";
import { Rol } from "@prisma/client";

export interface AuthPayload {
  sub: string;
  rol: Rol;
  numeroDocumento: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    return next(new HttpError(401, "No autenticado"));
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new HttpError(401, "Sesión inválida o expirada"));
  }
}

export function requireRole(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "No autenticado"));
    }
    if (!roles.includes(req.user.rol)) {
      return next(new HttpError(403, "No tiene permisos para esta acción"));
    }
    next();
  };
}
