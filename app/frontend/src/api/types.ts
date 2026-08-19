export type Rol = "ADMINISTRADOR" | "ASESOR" | "CONSULTA" | "TECNICO_SERVICIO";

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

export type EstadoOrdenTrabajo = "RADICADO" | "PROGRAMADO" | "EN_PROCESO" | "CERRADO" | "CANCELADO";
export type PrioridadOrdenTrabajo = "ALTA" | "MEDIA" | "BAJA";
export type TipoServicioOrdenTrabajo =
  | "PREVENTIVO"
  | "CORRECTIVO"
  | "PREVENTIVO_CORRECTIVO"
  | "DIAGNOSTICO"
  | "CORTESIA"
  | "GARANTIA"
  | "ENTREGA";

export interface OrdenTrabajo {
  id: string;
  numero: number;
  fechaSolicitud: string;
  cliente: string;
  clienteNit: string | null;
  numeroClienteSap: string | null;
  asesorPssr: string;
  valor: string | null;
  horasServicio: string | null;
  horasDesplazamiento: string | null;
  ordenTrabajoNumero: string | null;
  tipoServicio: TipoServicioOrdenTrabajo;
  descripcionServicio: string | null;
  sucursal: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  personaContacto: string | null;
  correoContacto: string | null;
  telefonoContacto: string | null;
  marca: string | null;
  modelo: string | null;
  serialMaquina: string | null;
  coordinadorAltura: boolean;
  equipoApoyo: boolean;
  fechaSugerida: string | null;
  fechaProgramacionReal: string | null;
  horaServicio: string | null;
  estado: EstadoOrdenTrabajo;
  prioridad: PrioridadOrdenTrabajo;
  tecnicoAsignado: string | null;
  codigoSap: string | null;
  fechaCierre: string | null;
  observaciones: string | null;
  programadorSegunSede: string | null;
  unidadIntervenirTaller: boolean;
  tipoTrabajo: string | null;
  fechaTrasladoTaller: string | null;
  reporteClick: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CapacidadTecnico {
  mes: number; // 1-12
  capacidadDiaria: number;
}

export interface Tecnico {
  id: string;
  nombres: string;
  apellidos: string;
  cargo: string | null;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
  userId: string | null;
  capacidades: CapacidadTecnico[];
  createdAt: string;
  updatedAt: string;
}

export type EstadoSolicitudServicio = "PENDIENTE" | "PROGRAMADA" | "CANCELADA";

export interface OrdenTrabajoResumen {
  numero: number;
  cliente: string;
  ciudad: string | null;
  marca: string | null;
  modelo: string | null;
  serialMaquina: string | null;
  asesorPssr: string;
}

export interface SolicitudServicio {
  id: string;
  numero: number;
  ordenTrabajoId: string;
  ordenTrabajo: OrdenTrabajoResumen;
  fechaSolicitada: string;
  estado: EstadoSolicitudServicio;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}
