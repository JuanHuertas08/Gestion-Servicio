import { api } from "./client";
import type { DashboardKpis } from "./types";

export async function getDashboardKpis(anio?: number, mes?: number, asesor?: string): Promise<DashboardKpis> {
  const { data } = await api.get<DashboardKpis>("/dashboard/kpis", {
    params: { anio, mes, asesor },
  });
  return data;
}

export interface DashboardFiltros {
  anios: number[];
}

export async function getDashboardFiltros(): Promise<DashboardFiltros> {
  const { data } = await api.get<DashboardFiltros>("/dashboard/filtros");
  return data;
}

export interface VentaPorPeriodo {
  periodo: string;
  ventaNeta: number;
}

export async function getVentasPorPeriodo(anio?: number, asesor?: string): Promise<VentaPorPeriodo[]> {
  const { data } = await api.get<VentaPorPeriodo[]>("/dashboard/ventas-por-periodo", {
    params: { anio, asesor },
  });
  return data;
}

export interface VentaPorTipo {
  tipo: string;
  ventaNeta: number;
}

export async function getVentasPorTipo(anio?: number, mes?: number, asesor?: string): Promise<VentaPorTipo[]> {
  const { data } = await api.get<VentaPorTipo[]>("/dashboard/ventas-por-tipo", { params: { anio, mes, asesor } });
  return data;
}

export interface VentaPorMarca {
  marca: string;
  ventaNeta: number;
}

export async function getVentasPorMarca(anio?: number, mes?: number, asesor?: string): Promise<VentaPorMarca[]> {
  const { data } = await api.get<VentaPorMarca[]>("/dashboard/ventas-por-marca", { params: { anio, mes, asesor } });
  return data;
}

export interface SeguimientoPorAsesor {
  pssr: string;
  total: number;
  realizados: number;
  cumplimientoPct: number;
}

export interface SeguimientoStats {
  total: number;
  realizados: number;
  pendientes: number;
  vencidos: number;
  cumplimientoPct: number;
  porAsesor: SeguimientoPorAsesor[];
}

export async function getSeguimientoStats(anio?: number, mes?: number, asesor?: string): Promise<SeguimientoStats> {
  const { data } = await api.get<SeguimientoStats>("/dashboard/seguimientos", { params: { anio, mes, asesor } });
  return data;
}
