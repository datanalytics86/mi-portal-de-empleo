/**
 * Validación profunda de archivos CV: extensión, MIME declarado y magic bytes.
 */

export const MAX_CV_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type AllowedMime = (typeof ALLOWED_MIME)[number];

export type CvFormat = 'pdf' | 'docx' | 'doc' | 'unknown';

export interface FileValidationResult {
  ok: boolean;
  error?: string;
  format: CvFormat;
  mimeType: AllowedMime | string;
  /** true si es .doc legacy (OLE) — extracción degradada */
  isLegacyDoc: boolean;
}

const EXT_MIME: Record<string, AllowedMime> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
};

function bytesToHex(bytes: Uint8Array, len: number): string {
  return Array.from(bytes.slice(0, len))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function startsWithAscii(bytes: Uint8Array, ascii: string): boolean {
  if (bytes.length < ascii.length) return false;
  for (let i = 0; i < ascii.length; i++) {
    if (bytes[i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * Detecta formato real por magic bytes (no confiar solo en Content-Type del cliente).
 */
export function detectFormatByMagic(buffer: ArrayBuffer): CvFormat {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4) return 'unknown';

  // PDF: %PDF
  if (startsWithAscii(bytes, '%PDF')) return 'pdf';

  // OLE Compound Document (.doc legacy): D0 CF 11 E0 A1 B1 1A E1
  const hex8 = bytesToHex(bytes, 8);
  if (hex8.startsWith('d0cf11e0')) return 'doc';

  // ZIP container (DOCX is a zip): PK\x03\x04 or PK\x05\x06 or PK\x07\x08
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    // Could be docx/xlsx/etc — treat as docx if extension/mime says so later
    return 'docx';
  }

  return 'unknown';
}

export function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? (parts.pop() || '') : '';
}

/**
 * Valida un File / Blob de CV con MIME + magic bytes + tamaño.
 */
export function validateCvFile(
  buffer: ArrayBuffer,
  declaredMime: string,
  fileName: string,
  sizeBytes?: number,
): FileValidationResult {
  const size = sizeBytes ?? buffer.byteLength;

  if (size === 0) {
    return { ok: false, error: 'Debes adjuntar tu CV.', format: 'unknown', mimeType: declaredMime, isLegacyDoc: false };
  }
  if (size > MAX_CV_SIZE) {
    return {
      ok: false,
      error: 'El CV supera el tamaño máximo de 5MB.',
      format: 'unknown',
      mimeType: declaredMime,
      isLegacyDoc: false,
    };
  }

  const ext = extensionOf(fileName);
  const magic = detectFormatByMagic(buffer);

  // Extensión permitida
  if (ext && !['pdf', 'doc', 'docx'].includes(ext)) {
    return {
      ok: false,
      error: 'Solo se aceptan archivos PDF o Word (.pdf, .docx, .doc).',
      format: magic,
      mimeType: declaredMime,
      isLegacyDoc: magic === 'doc',
    };
  }

  // Magic bytes deben coincidir con extensión cuando sea posible
  if (magic === 'unknown') {
    return {
      ok: false,
      error: 'El archivo no parece ser un PDF o Word válido.',
      format: 'unknown',
      mimeType: declaredMime,
      isLegacyDoc: false,
    };
  }

  if (ext === 'pdf' && magic !== 'pdf') {
    return {
      ok: false,
      error: 'El contenido del archivo no coincide con un PDF válido.',
      format: magic,
      mimeType: declaredMime,
      isLegacyDoc: false,
    };
  }

  if (ext === 'docx' && magic !== 'docx') {
    return {
      ok: false,
      error: 'El contenido del archivo no coincide con un DOCX válido.',
      format: magic,
      mimeType: declaredMime,
      isLegacyDoc: magic === 'doc',
    };
  }

  if (ext === 'doc' && magic !== 'doc' && magic !== 'docx') {
    // Algunos "doc" modernos son zip/docx renombrados
    return {
      ok: false,
      error: 'El contenido del archivo no coincide con un Word válido.',
      format: magic,
      mimeType: declaredMime,
      isLegacyDoc: false,
    };
  }

  // MIME declarado (si viene) debe estar en la lista o ser vacío/genérico
  const looseMime =
    !declaredMime ||
    declaredMime === 'application/octet-stream' ||
    ALLOWED_MIME.includes(declaredMime as AllowedMime);

  if (declaredMime && !looseMime && !ALLOWED_MIME.includes(declaredMime as AllowedMime)) {
    // Si magic es OK, preferimos magic sobre MIME mentiroso del browser
    console.warn('[cv-validate] MIME declarado sospechoso, se usa magic bytes:', declaredMime, magic);
  }

  const resolvedMime: string =
    magic === 'pdf'
      ? 'application/pdf'
      : magic === 'doc'
        ? 'application/msword'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  // Si la extensión dice docx pero detectamos doc, respetar magic
  const format: CvFormat = magic;

  return {
    ok: true,
    format,
    mimeType: resolvedMime,
    isLegacyDoc: format === 'doc',
  };
}

export function storageExtension(format: CvFormat, fileName: string): string {
  if (format === 'pdf') return 'pdf';
  if (format === 'docx') return 'docx';
  if (format === 'doc') return 'doc';
  return extensionOf(fileName) || 'bin';
}
