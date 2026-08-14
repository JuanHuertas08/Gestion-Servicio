/**
 * Llave combinada para detectar recargas del mismo renglón de Facturación: cliente + factura +
 * fecha de facturación + tipo de facturación, normalizados (trim + mayúsculas) para no fallar por
 * diferencias de formato. Null si falta cualquiera de los cuatro componentes (esas filas nunca se
 * consideran duplicadas de nada).
 *
 * Usada tanto por el parser de Excel (filas nuevas) como por el script de backfill (filas ya
 * almacenadas), para garantizar que ambos calculen exactamente la misma llave.
 */
export function computeClaveDedupe(
  cliente: string | null,
  factura: string | null,
  fechaFacturacion: Date | null,
  tipoFacturacion: string | null
): string | null {
  if (!cliente || !factura || !fechaFacturacion || !tipoFacturacion) return null;
  const fecha = fechaFacturacion.toISOString().slice(0, 10);
  return [
    cliente.trim().toUpperCase(),
    factura.trim().toUpperCase(),
    fecha,
    tipoFacturacion.trim().toUpperCase(),
  ].join("||");
}
