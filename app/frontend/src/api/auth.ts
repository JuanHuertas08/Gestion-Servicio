import { api } from "./client";
import type { CurrentUser } from "./types";

export async function login(numeroDocumento: string, password: string): Promise<CurrentUser> {
  const { data } = await api.post<CurrentUser>("/auth/login", { numeroDocumento, password });
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function fetchMe(): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>("/auth/me");
  return data;
}

export async function changePassword(actualPassword: string, nuevaPassword: string): Promise<void> {
  await api.post("/auth/cambiar-password", { actualPassword, nuevaPassword });
}
