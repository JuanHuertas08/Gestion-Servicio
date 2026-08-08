import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Datos inválidos", detalles: err.flatten() });
  }
  console.error(err);
  return res.status(500).json({ error: "Error interno del servidor" });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Recurso no encontrado" });
}
