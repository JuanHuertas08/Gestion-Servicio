export type Rol = "ADMINISTRADOR" | "ASESOR" | "CONSULTA";

export interface CurrentUser {
  id: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  correo?: string;
  rol: Rol;
}

export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  accion: string;
  entidad: string;
  cambios: unknown;
  createdAt: string;
  actor: { nombres: string; apellidos: string; numeroDocumento: string };
  target: { nombres: string; apellidos: string; numeroDocumento: string } | null;
}

export interface PagedResult<T> {
  total: number;
  page: number;
  pageSize: number;
  data: T[];
}

export interface Factura {
  id: string;
  centro: string | null;
  pssr: string | null;
  cliente: string | null;
  factura: string;
  pedido: string;
  marca: string | null;
  fechaFacturacion: string | null;
  ventaNeta: string | null;
  margenPct: string | null;
  esquemaServicio: string | null;
  tipoFacturacion: string | null;
  proximaFechaSeguimiento: string | null;
}

export interface ParametroSeguimiento {
  id: string;
  tipoFacturacion: string;
  diasSeguimiento: number;
  updatedAt: string;
}

export interface ImportBatch {
  id: string;
  modulo: string;
  nombreArchivo: string;
  filasTotal: number;
  filasNuevas: number;
  filasActualizadas: number;
  filasError: number;
  estado: string;
  createdAt: string;
  subidoPor: { nombres: string; apellidos: string };
}

export type EstadoSeguimiento = "PENDIENTE" | "REALIZADO";

export interface SeguimientoCliente {
  cliente: string;
  tipoFacturacion: string;
  pssr: string | null;
  ultimaFechaFacturacion: string | null;
  fechaUltimoSeguimiento: string | null;
  fechaProximoSeguimiento: string | null;
  estado: EstadoSeguimiento;
  observaciones: string | null;
}

export interface FiltrosSeguimiento {
  asesores: string[];
  tiposFacturacion: string[];
}

export interface DashboardKpis {
  ventaNeta: number;
  margenUsd: number;
  margenPct: number;
  numFacturas: number;
  topAsesores: { pssr: string | null; ventaNeta: number }[];
}
