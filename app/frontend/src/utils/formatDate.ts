/**
 * Formatea una fecha "de calendario" (sin hora significativa, ej. fecha de facturación o de
 * seguimiento) usando el componente UTC del ISO string. El backend guarda estas fechas a
 * medianoche UTC; si se formatea con la zona horaria local del navegador, un servidor/host con
 * offset negativo (America/Guatemala, America/Bogota, etc.) muestra el día anterior.
 */
export function formatFecha(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-CO", { timeZone: "UTC" });
}

/**
 * Formatea una marca de tiempo real (ej. cuándo se registró algo), con fecha y hora en la zona
 * horaria local de quien mira la pantalla — a diferencia de formatFecha, aquí sí importa la hora.
 */
export function formatFechaHora(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}
