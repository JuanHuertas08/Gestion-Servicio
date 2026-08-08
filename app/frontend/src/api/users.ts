import { api } from "./client";
import type { AuditLogEntry, PagedResult, Usuario } from "./types";

export interface ListUsersParams {
  page: number;
  pageSize: number;
  busqueda?: string;
  rol?: string;
  activo?: boolean;
}

export async function listUsers(params: ListUsersParams): Promise<PagedResult<Usuario>> {
  const { data } = await api.get<PagedResult<Usuario>>("/usuarios", { params });
  return data;
}

export interface CreateUserInput {
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  rol: string;
  password: string;
}

export async function createUser(input: CreateUserInput): Promise<Usuario> {
  const { data } = await api.post<Usuario>("/usuarios", input);
  return data;
}

export interface UpdateUserInput {
  nombres?: string;
  apellidos?: string;
  correo?: string;
  telefono?: string;
  rol?: string;
  password?: string;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<Usuario> {
  const { data } = await api.put<Usuario>(`/usuarios/${id}`, input);
  return data;
}

export async function setUserActivo(id: string, activo: boolean): Promise<Usuario> {
  const { data } = await api.patch<Usuario>(`/usuarios/${id}/estado`, { activo });
  return data;
}

export async function listAuditLogs(usuarioId?: string): Promise<AuditLogEntry[]> {
  const { data } = await api.get<AuditLogEntry[]>("/usuarios/auditoria", {
    params: usuarioId ? { usuarioId } : undefined,
  });
  return data;
}
