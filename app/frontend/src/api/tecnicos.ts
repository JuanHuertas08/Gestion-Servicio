import { api } from "./client";
import type { CapacidadTecnico, Tecnico } from "./types";

export async function listTecnicos(estado?: "ACTIVO" | "INACTIVO"): Promise<Tecnico[]> {
  const { data } = await api.get<Tecnico[]>("/tecnicos", { params: { estado } });
  return data;
}

export interface TecnicoInput {
  nombres: string;
  apellidos: string;
  cargo?: string;
  telefono?: string;
  correo?: string;
  capacidades?: CapacidadTecnico[];
}

export async function createTecnico(input: TecnicoInput): Promise<Tecnico> {
  const { data } = await api.post<Tecnico>("/tecnicos", input);
  return data;
}

export async function updateTecnico(id: string, input: Partial<TecnicoInput>): Promise<Tecnico> {
  const { data } = await api.put<Tecnico>(`/tecnicos/${id}`, input);
  return data;
}

export async function setTecnicoActivo(id: string, activo: boolean): Promise<Tecnico> {
  const { data } = await api.patch<Tecnico>(`/tecnicos/${id}/activo`, { activo });
  return data;
}
