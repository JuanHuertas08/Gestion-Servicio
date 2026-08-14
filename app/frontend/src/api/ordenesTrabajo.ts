import { api } from "./client";
import type {
  EstadoOrdenTrabajo,
  OrdenTrabajo,
  PagedResult,
  PrioridadOrdenTrabajo,
  TipoServicioOrdenTrabajo,
} from "./types";

export interface ListOrdenesTrabajoParams {
  page: number;
  pageSize: number;
  cliente?: string;
  asesorPssr?: string;
  estado?: EstadoOrdenTrabajo;
  prioridad?: PrioridadOrdenTrabajo;
  ciudad?: string;
}

export async function listOrdenesTrabajo(
  params: ListOrdenesTrabajoParams
): Promise<PagedResult<OrdenTrabajo>> {
  const { data } = await api.get<PagedResult<OrdenTrabajo>>("/ordenes-trabajo", { params });
  return data;
}

export async function getOrdenTrabajo(id: string): Promise<OrdenTrabajo> {
  const { data } = await api.get<OrdenTrabajo>(`/ordenes-trabajo/${id}`);
  return data;
}

export interface OrdenTrabajoInput {
  fechaSolicitud: string;
  cliente: string;
  clienteNit?: string;
  numeroClienteSap?: string;
  asesorPssr: string;
  valor?: number;
  horasServicio?: number;
  horasDesplazamiento?: number;
  ordenTrabajoNumero?: string;
  tipoServicio: TipoServicioOrdenTrabajo;
  descripcionServicio?: string;
  sucursal?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  personaContacto?: string;
  correoContacto?: string;
  telefonoContacto?: string;
  marca?: string;
  modelo?: string;
  serialMaquina?: string;
  coordinadorAltura?: boolean;
  equipoApoyo?: boolean;
  fechaSugerida?: string;
  fechaProgramacionReal?: string;
  horaServicio?: string;
  estado?: EstadoOrdenTrabajo;
  prioridad?: PrioridadOrdenTrabajo;
  tecnicoAsignado?: string;
  codigoSap?: string;
  fechaCierre?: string;
  observaciones?: string;
  programadorSegunSede?: string;
  unidadIntervenirTaller?: boolean;
  tipoTrabajo?: string;
  fechaTrasladoTaller?: string;
  reporteClick?: boolean;
}

export async function createOrdenTrabajo(input: OrdenTrabajoInput): Promise<OrdenTrabajo> {
  const { data } = await api.post<OrdenTrabajo>("/ordenes-trabajo", input);
  return data;
}

export async function updateOrdenTrabajo(
  id: string,
  input: Partial<OrdenTrabajoInput>
): Promise<OrdenTrabajo> {
  const { data } = await api.put<OrdenTrabajo>(`/ordenes-trabajo/${id}`, input);
  return data;
}

/** "Eliminar" no borra la orden: la pasa a estado Cancelado. */
export async function cancelarOrdenTrabajo(id: string): Promise<OrdenTrabajo> {
  const { data } = await api.delete<OrdenTrabajo>(`/ordenes-trabajo/${id}`);
  return data;
}

export interface DatosExtraidosPdf {
  cliente: string | null;
  clienteNit: string | null;
  numeroClienteSap: string | null;
  ciudad: string | null;
}

export async function extraerDatosDesdePdf(file: File): Promise<DatosExtraidosPdf> {
  const formData = new FormData();
  formData.append("archivo", file);
  const { data } = await api.post<DatosExtraidosPdf>("/ordenes-trabajo/extraer-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
