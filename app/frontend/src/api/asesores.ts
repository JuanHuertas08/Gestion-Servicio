import { api } from "./client";

export interface Asesor {
  id: string;
  nombreCompleto: string;
  activo: boolean;
  correo: string | null;
  telefono: string | null;
  userId: string | null;
}

export async function listAsesores(): Promise<Asesor[]> {
  const { data } = await api.get<Asesor[]>("/asesores");
  return data;
}

export interface AsesorAdmin extends Asesor {
  numeroDocumento: string | null;
  updatedAt: string;
}

export async function listAsesoresAdmin(estado?: "ACTIVO" | "INACTIVO"): Promise<AsesorAdmin[]> {
  const { data } = await api.get<AsesorAdmin[]>("/asesores/admin", { params: { estado } });
  return data;
}

export interface UpdateAsesorInput {
  numeroDocumento?: string;
  correo?: string;
  telefono?: string;
}

export async function updateAsesor(id: string, input: UpdateAsesorInput): Promise<AsesorAdmin> {
  const { data } = await api.put<AsesorAdmin>(`/asesores/${id}`, input);
  return data;
}

export async function setAsesorActivo(id: string, activo: boolean): Promise<AsesorAdmin> {
  const { data } = await api.patch<AsesorAdmin>(`/asesores/${id}/activo`, { activo });
  return data;
}
