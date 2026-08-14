import * as XLSX from "xlsx";
import {
  FACTURACION_COLUMN_INDEX,
  FACTURACION_EXPECTED_HEADERS,
} from "./facturacion.columns";
import {
  normalizeDecimal,
  normalizeExcelDate,
  normalizeInt,
  normalizeText,
  normalizeUpperKey,
} from "../../utils/dateNormalizer";
import { computeClaveDedupe } from "../../utils/dedupeKey";

export interface ParsedFacturaRow {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: string[];
}

export interface ParseResult {
  rows: ParsedFacturaRow[];
  headerErrors: string[];
}

function validateHeaders(headerRow: unknown[]): string[] {
  const errors: string[] = [];
  const normalized = headerRow.map((h) => String(h ?? "").trim());
  FACTURACION_EXPECTED_HEADERS.forEach((expected, idx) => {
    if (normalized[idx] !== expected) {
      errors.push(
        `Columna ${idx + 1}: se esperaba "${expected}" y se encontró "${normalized[idx] ?? "(vacío)"}"`
      );
    }
  });
  return errors;
}

export function parseFacturacionWorkbook(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (rows.length === 0) {
    return { rows: [], headerErrors: ["El archivo está vacío"] };
  }

  const headerErrors = validateHeaders(rows[0]);
  if (headerErrors.length > 0) {
    return { rows: [], headerErrors };
  }

  const idx = FACTURACION_COLUMN_INDEX;
  const parsedRows: ParsedFacturaRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => cell === "" || cell === null || cell === undefined)) {
      continue;
    }
    const errors: string[] = [];
    const factura = normalizeText(row[idx.factura]);
    const pedido = normalizeText(row[idx.pedido]);
    if (!factura) errors.push("FACTURA vacía");
    if (!pedido) errors.push("Pedido vacío");

    const cliente = normalizeText(row[idx.cliente]);
    const fechaFacturacion = normalizeExcelDate(row[idx.fechaFacturacion]);
    const tipoFacturacion = normalizeUpperKey(row[idx.tipoFacturacion]);

    parsedRows.push({
      rowNumber: i + 1,
      errors,
      data: {
        anioMesNatural: normalizeText(row[idx.anioMesNatural]),
        centro: normalizeText(row[idx.centro]),
        centro2: normalizeText(row[idx.centro2]),
        centroBeneficio: normalizeText(row[idx.centroBeneficio]),
        pssr: normalizeText(row[idx.pssr]),
        motivoPedido: normalizeText(row[idx.motivoPedido]),
        pedido: pedido ?? "",
        marca: normalizeUpperKey(row[idx.marca]),
        cliente,
        factura: factura ?? "",
        fechaDocumento: normalizeExcelDate(row[idx.fechaDocumento]),
        fechaFacturacion,
        claveDedupe: computeClaveDedupe(cliente, factura, fechaFacturacion, tipoFacturacion),
        piezas: normalizeDecimal(row[idx.piezas]),
        ventaNeta: normalizeDecimal(row[idx.ventaNeta]),
        grossMarginUsd: normalizeDecimal(row[idx.grossMarginUsd]),
        repuestos: normalizeDecimal(row[idx.repuestos]),
        margenPct: normalizeDecimal(row[idx.margenPct]),
        manoObra: normalizeDecimal(row[idx.manoObra]),
        trabajosTerceros: normalizeDecimal(row[idx.trabajosTerceros]),
        insumos: normalizeDecimal(row[idx.insumos]),
        descuento: normalizeDecimal(row[idx.descuento]),
        descuentoPct: normalizeDecimal(row[idx.descuentoPct]),
        anio: normalizeInt(row[idx.anio]),
        mes: normalizeText(row[idx.mes]),
        pctRepuestos: normalizeDecimal(row[idx.pctRepuestos]),
        pctManoObra: normalizeDecimal(row[idx.pctManoObra]),
        unidad: normalizeUpperKey(row[idx.unidad]),
        tipoDoc: normalizeUpperKey(row[idx.tipoDoc]),
        causalNc: normalizeText(row[idx.causalNc]),
        anioCompra: normalizeInt(row[idx.anioCompra]),
        mesCompra: normalizeInt(row[idx.mesCompra]),
        fechaPrimeraCompra: normalizeExcelDate(row[idx.fechaPrimeraCompra]),
        primerMesCompra: normalizeText(row[idx.primerMesCompra]),
        esquemaServicio: normalizeUpperKey(row[idx.esquemaServicio]),
        tipoFacturacion,
        ultimaFactura: normalizeExcelDate(row[idx.ultimaFactura]),
        seguimientoFecha: normalizeExcelDate(row[idx.seguimientoFecha]),
      },
    });
  }

  return { rows: parsedRows, headerErrors: [] };
}
