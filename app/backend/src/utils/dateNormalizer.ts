const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * El Excel de origen mezcla seriales de fecha de Excel (números) con texto "dd-mm-aaaa".
 * Normaliza ambos formatos a Date, o null si la celda está vacía/no es una fecha válida.
 */
export function normalizeExcelDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return new Date(EXCEL_EPOCH + value * MS_PER_DAY);
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const ddmmyyyy = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyy) {
      const [, d, m, y] = ddmmyyyy;
      return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

export function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

export function normalizeUpperKey(value: unknown): string | null {
  const text = normalizeText(value);
  return text ? text.toUpperCase() : null;
}

export function normalizeDecimal(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export function normalizeInt(value: unknown): number | null {
  const num = normalizeDecimal(value);
  return num === null ? null : Math.trunc(num);
}
