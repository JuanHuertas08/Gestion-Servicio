import { api } from "./client";
import type { EstadoSeguimiento, FiltrosSeguimiento, PagedResult, SeguimientoCliente } from "./types";

export interface ListSeguimientosParams {
  page: number;
  pageSize: number;
  asesor?: string;
  cliente?: string;
  tipoFacturacion?: string;
}

export async function listSeguimientos(
  params: ListSeguimientosParams
): Promise<PagedResult<SeguimientoCliente>> {
  const { data } = await api.get<PagedResult<SeguimientoCliente>>("/proyeccion", { params });
  return data;
}

export async function listFiltrosSeguimiento(): Promise<FiltrosSeguimiento> {
  const { data } = await api.get<FiltrosSeguimiento>("/proyeccion/filtros");
  return data;
}

export interface RegistrarSeguimientoInput {
  cliente: string;
  tipoFacturacion: string;
  estado: EstadoSeguimiento;
  fechaSeguimiento: string;
  observaciones?: string;
}

export async function registrarSeguimiento(input: RegistrarSeguimientoInput): Promise<SeguimientoCliente> {
  const { data } = await api.post<SeguimientoCliente>("/proyeccion/registrar", input);
  return data;
}

export interface HistorialSeguimientoEntry {
  id: string;
  estado: EstadoSeguimiento;
  fechaSeguimiento: string;
  observaciones: string | null;
  createdAt: string;
  registradoPor: { nombres: string; apellidos: string; numeroDocumento: string } | null;
}

export async function listHistorialSeguimiento(
  cliente: string,
  tipoFacturacion: string
): Promise<HistorialSeguimientoEntry[]> {
  const { data } = await api.get<HistorialSeguimientoEntry[]>("/proyeccion/historial", {
    params: { cliente, tipoFacturacion },
  });
  return data;
}
