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
