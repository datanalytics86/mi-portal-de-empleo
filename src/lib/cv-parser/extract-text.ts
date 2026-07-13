import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import type { CvFormat } from './file-validation';
import { isOcrEnabled, ocrPdf } from './ocr';

export interface ExtractTextResult {
  text: string;
  cleaned: string;
  /** true si el PDF original no tenía capa de texto útil */
  likelyScanned: boolean;
  /** true si el texto final vino (total o parcialmente) de OCR */
  usedOcr: boolean;
  ocrEngine?: 'ocr_space' | 'tesseract' | 'none';
  ocrPages?: number;
  format: CvFormat;
  warning?: string;
}

const MIN_NATIVE_CHARS = 80;
const MIN_OCR_CHARS = 40;

/**
 * Extrae texto plano de PDF o DOCX.
 * PDF escaneado → fallback OCR (ocr.space y/o tesseract).
 * .doc legacy: graceful degradation.
 */
export async function extractCvText(
  buffer: ArrayBuffer,
  format: CvFormat,
): Promise<ExtractTextResult> {
  const buf = Buffer.from(buffer);

  if (format === 'doc') {
    return {
      text: '',
      cleaned: '',
      likelyScanned: false,
      usedOcr: false,
      format,
      warning:
        'Formato .doc antiguo no soportado para parsing. Sube PDF o DOCX para análisis automático.',
    };
  }

  if (format === 'pdf') {
    return extractPdfWithOcrFallback(buffer, buf);
  }

  if (format === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer: buf });
      const text = result.value || '';
      const cleaned = cleanCvText(text);
      return {
        text,
        cleaned,
        likelyScanned: cleaned.replace(/\s/g, '').length < 40,
        usedOcr: false,
        format,
        warning:
          cleaned.replace(/\s/g, '').length < 40
            ? 'El DOCX tiene muy poco texto extraíble.'
            : undefined,
      };
    } catch (e) {
      console.error('[extract-text] DOCX error:', e);
      return {
        text: '',
        cleaned: '',
        likelyScanned: false,
        usedOcr: false,
        format,
        warning: 'No se pudo leer el archivo Word.',
      };
    }
  }

  return {
    text: '',
    cleaned: '',
    likelyScanned: false,
    usedOcr: false,
    format: 'unknown',
    warning: 'Formato no soportado.',
  };
}

async function extractPdfWithOcrFallback(
  arrayBuffer: ArrayBuffer,
  buf: Buffer,
): Promise<ExtractTextResult> {
  let nativeText = '';
  let nativeError: string | undefined;

  try {
    const data = await pdfParse(buf);
    nativeText = data.text || '';
  } catch (e) {
    console.error('[extract-text] PDF native error:', e);
    nativeError = 'No se pudo leer el PDF con extractor nativo.';
  }

  const nativeCleaned = cleanCvText(nativeText);
  const nativeLen = nativeCleaned.replace(/\s/g, '').length;
  const likelyScanned = nativeLen < MIN_NATIVE_CHARS;

  // Texto nativo suficiente → listo
  if (!likelyScanned) {
    return {
      text: nativeText,
      cleaned: nativeCleaned,
      likelyScanned: false,
      usedOcr: false,
      format: 'pdf',
    };
  }

  // Fallback OCR
  if (!isOcrEnabled()) {
    return {
      text: nativeText,
      cleaned: nativeCleaned,
      likelyScanned: true,
      usedOcr: false,
      format: 'pdf',
      warning:
        nativeError ||
        'El PDF parece escaneado y OCR está deshabilitado (CV_OCR_ENABLED=false).',
    };
  }

  console.info(
    `[extract-text] PDF con poco texto nativo (${nativeLen} chars) → OCR…`,
  );

  const ocr = await ocrPdf(arrayBuffer);
  const ocrCleaned = cleanCvText(ocr.text);
  const ocrLen = ocrCleaned.replace(/\s/g, '').length;

  if (ocrLen >= MIN_OCR_CHARS) {
    // Preferir OCR; si nativo tenía algo, anexar solo si aporta
    const merged =
      nativeLen > 0 && !ocrCleaned.includes(nativeCleaned.slice(0, 40))
        ? cleanCvText(`${nativeCleaned}\n\n${ocrCleaned}`)
        : ocrCleaned;

    return {
      text: ocr.text,
      cleaned: merged,
      likelyScanned: true,
      usedOcr: true,
      ocrEngine: ocr.engine,
      ocrPages: ocr.pages,
      format: 'pdf',
      warning: `PDF escaneado: texto vía OCR (${ocr.engine}, ${ocr.pages} pág., ${ocr.ms}ms). Puede haber errores de reconocimiento.`,
    };
  }

  // OCR falló o insuficiente
  const parts = [
    nativeError,
    'El PDF parece escaneado o sin texto seleccionable.',
    ocr.error ? `OCR: ${ocr.error}` : 'OCR no obtuvo texto legible.',
    'Sugerencia: sube un PDF con texto seleccionable o un DOCX.',
  ].filter(Boolean);

  return {
    text: nativeText || ocr.text,
    cleaned: nativeCleaned || ocrCleaned,
    likelyScanned: true,
    usedOcr: ocr.engine !== 'none' && ocrLen > 0,
    ocrEngine: ocr.engine,
    ocrPages: ocr.pages,
    format: 'pdf',
    warning: parts.join(' '),
  };
}

/**
 * Limpia ruido típico de CVs: headers/footers, bullets, espacios.
 * Ligera normalización de artefactos OCR (sin reescrituras agresivas).
 */
export function cleanCvText(raw: string): string {
  if (!raw) return '';

  let t = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\u00AD/g, '')
    .replace(/[•●○▪▸►◆◇■□◦‣]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\t/g, ' ')
    // OCR: secuencias de espacios múltiples
    .replace(/ {2,}/g, ' ');

  t = t
    .split('\n')
    .map((line) => line.replace(/[ ]{2,}/g, ' ').trimEnd())
    .join('\n');

  t = t
    .split('\n')
    .filter((line) => {
      const s = line.trim();
      if (!s) return true;
      if (/^(página|page)\s*\d+(\s*(de|of|\/)\s*\d+)?$/i.test(s)) return false;
      if (/^[-–—]?\s*\d{1,3}\s*[-–—]?$/.test(s)) return false;
      if (/^\d+\s*\/\s*\d+$/.test(s)) return false;
      // Líneas basura OCR (solo símbolos)
      if (/^[^\wáéíóúñÁÉÍÓÚÑ@.+-]{3,}$/i.test(s)) return false;
      return true;
    })
    .join('\n');

  const freq = new Map<string, number>();
  for (const line of t.split('\n')) {
    const key = line.trim().toLowerCase();
    if (key.length > 0 && key.length < 60) {
      freq.set(key, (freq.get(key) || 0) + 1);
    }
  }
  const repeated = new Set(
    [...freq.entries()].filter(([, n]) => n >= 3).map(([k]) => k),
  );
  if (repeated.size > 0) {
    t = t
      .split('\n')
      .filter((line) => !repeated.has(line.trim().toLowerCase()))
      .join('\n');
  }

  return t.replace(/\n{3,}/g, '\n\n').trim();
}

/** Compat: API antigua */
export async function extractText(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  const format: CvFormat =
    mimeType === 'application/pdf'
      ? 'pdf'
      : mimeType === 'application/msword'
        ? 'doc'
        : mimeType.includes('wordprocessingml')
          ? 'docx'
          : 'unknown';
  const result = await extractCvText(buffer, format);
  return result.cleaned || result.text;
}
