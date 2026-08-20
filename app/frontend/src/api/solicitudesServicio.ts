import { api } from "./client";
import type { EstadoSolicitudServicio, PagedResult, SolicitudServicio, TecnicoDisponible } from "./types";

export interface ListSolicitudesServicioParams {
  page: number;
  pageSize: number;
  estado?: EstadoSolicitudServicio;
  cliente?: string;
  fechaProgramadaDesde?: string;
  fechaProgramadaHasta?: string;
}

export async function listSolicitudesServicio(
  params: ListSolicitudesServicioParams
): Promise<PagedResult<SolicitudServicio>> {
  const { data } = await api.get<PagedResult<SolicitudServicio>>("/solicitudes-servicio", { params });
  return data;
}

export interface SolicitudServicioInput {
  ordenTrabajoId: string;
  fechaSolicitada: string;
  observaciones?: string;
}

export async function createSolicitudServicio(input: SolicitudServicioInput): Promise<SolicitudServicio> {
  const { data } = await api.post<SolicitudServicio>("/solicitudes-servicio", input);
  return data;
}

export interface UpdateSolicitudServicioInput extends Partial<SolicitudServicioInput> {
  tecnicoId?: string;
  fechaProgramada?: string;
  horaProgramada?: string;
}

export async function updateSolicitudServicio(
  id: string,
  input: UpdateSolicitudServicioInput
): Promise<SolicitudServicio> {
  const { data } = await api.put<SolicitudServicio>(`/solicitudes-servicio/${id}`, input);
  return data;
}

/** "Eliminar" no borra la solicitud: la pasa a estado Cancelada. */
export async function cancelarSolicitudServicio(id: string): Promise<SolicitudServicio> {
  const { data } = await api.delete<SolicitudServicio>(`/solicitudes-servicio/${id}`);
  return data;
}

export async function getTecnicosDisponibles(fecha: string): Promise<TecnicoDisponible[]> {
  const { data } = await api.get<TecnicoDisponible[]>("/solicitudes-servicio/tecnicos-disponibles", {
    params: { fecha },
  });
  return data;
}

export interface AprobarSolicitudServicioInput {
  tecnicoId: string;
  fechaProgramada: string;
  horaProgramada: string;
}

export async function aprobarSolicitudServicio(
  id: string,
  input: AprobarSolicitudServicioInput
): Promise<SolicitudServicio> {
  const { data } = await api.post<SolicitudServicio>(`/solicitudes-servicio/${id}/aprobar`, input);
  return data;
}
