import { api } from "./client";
import type { Factura, ImportBatch, PagedResult, ParametroSeguimiento } from "./types";

export interface ListFacturasParams {
  page: number;
  pageSize: number;
  centro?: string;
  marca?: string;
  pssr?: string;
  cliente?: string;
}

export async function listFacturas(params: ListFacturasParams): Promise<PagedResult<Factura>> {
  const { data } = await api.get<PagedResult<Factura>>("/facturacion", { params });
  return data;
}

export async function importFacturacion(file: File): Promise<{ batch: ImportBatch; headerErrors: string[] }> {
  const formData = new FormData();
  formData.append("archivo", file);
  const { data } = await api.post("/facturacion/importar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listImportBatches(): Promise<ImportBatch[]> {
  const { data } = await api.get<ImportBatch[]>("/facturacion/importaciones");
  return data;
}

export async function listParametrosSeguimiento(): Promise<ParametroSeguimiento[]> {
  const { data } = await api.get<ParametroSeguimiento[]>("/facturacion/parametros-seguimiento");
  return data;
}

export async function updateParametrosSeguimiento(
  parametros: { tipoFacturacion: string; diasSeguimiento: number }[]
): Promise<ParametroSeguimiento[]> {
  const { data } = await api.put<ParametroSeguimiento[]>("/facturacion/parametros-seguimiento", {
    parametros,
  });
  return data;
}
