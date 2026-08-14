import pdfParse from "pdf-parse";

export interface DatosExtraidosPdf {
  cliente: string | null;
  clienteNit: string | null;
  numeroClienteSap: string | null;
  ciudad: string | null;
}

/**
 * Muchos PDF generados por SAP (como el "PICKING") concatenan el número y el texto que sigue sin
 * espacio (p.ej. "20876744OVOPRODUCTOS DEL"). Separa el prefijo numérico del resto de la línea.
 */
function splitLeadingDigits(line: string): { digits: string; resto: string } | null {
  const m = line.match(/^(\d[\d.]*)(.*)$/);
  if (!m) return null;
  return { digits: m[1], resto: m[2].trim() };
}

/**
 * Extracción best-effort de Cliente / NIT / Ciudad / Número de cliente SAP a partir de un PDF con
 * el layout típico de los documentos SAP de este negocio (encabezado "Numero de Cliente: Nombre:"
 * seguido de "NIT/CI: Ciudad:"). Si el PDF no trae ese layout, o es ilegible (escaneado, dañado),
 * simplemente devuelve todo en null — nunca lanza error, el usuario completa el formulario a mano.
 */
export async function extraerDatosDesdePdf(buffer: Buffer): Promise<DatosExtraidosPdf> {
  const resultado: DatosExtraidosPdf = {
    cliente: null,
    clienteNit: null,
    numeroClienteSap: null,
    ciudad: null,
  };

  let texto: string;
  try {
    const parsed = await pdfParse(buffer);
    texto = parsed.text;
  } catch {
    return resultado;
  }

  const lineas = texto.split("\n").map((l) => l.trim());

  const idxNumeroCliente = lineas.findIndex((l) => /^Numero de Cliente:/i.test(l));
  const idxNit = lineas.findIndex((l, i) => i > idxNumeroCliente && /^NIT\/CI:/i.test(l));

  if (idxNumeroCliente !== -1 && idxNumeroCliente + 1 < lineas.length) {
    const primera = splitLeadingDigits(lineas[idxNumeroCliente + 1]);
    if (primera) {
      resultado.numeroClienteSap = primera.digits;
      const limite = idxNit !== -1 ? idxNit : Math.min(idxNumeroCliente + 4, lineas.length);
      const partesNombre = [primera.resto];
      for (let i = idxNumeroCliente + 2; i < limite; i++) {
        if (lineas[i]) partesNombre.push(lineas[i]);
      }
      const nombre = partesNombre.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      resultado.cliente = nombre || null;
    }
  }

  if (idxNit !== -1 && idxNit + 1 < lineas.length) {
    const primera = splitLeadingDigits(lineas[idxNit + 1]);
    if (primera) {
      resultado.clienteNit = primera.digits;
      resultado.ciudad = primera.resto || null;
    }
  }

  return resultado;
}
