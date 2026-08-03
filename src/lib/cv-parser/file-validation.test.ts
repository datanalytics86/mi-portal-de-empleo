import { describe, it, expect } from 'vitest';
import {
  validateCvFile,
  detectFormatByMagic,
  extensionOf,
  storageExtension,
  MAX_CV_SIZE,
} from './file-validation';

/** Construye un ArrayBuffer con magic bytes de PDF */
function pdfBuffer(extra = 0): ArrayBuffer {
  const header = new TextEncoder().encode('%PDF-1.4\n');
  const buf = new Uint8Array(header.length + extra);
  buf.set(header);
  return buf.buffer;
}

/** Magic OLE Compound Document (.doc legacy) */
function docBuffer(): ArrayBuffer {
  const bytes = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00]);
  return bytes.buffer;
}

/** Magic ZIP (DOCX) */
function zipBuffer(): ArrayBuffer {
  const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
  return bytes.buffer;
}

function randomBuffer(size: number): ArrayBuffer {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = (i * 17 + 3) % 256;
  return bytes.buffer;
}

describe('detectFormatByMagic', () => {
  it('detecta PDF', () => {
    expect(detectFormatByMagic(pdfBuffer())).toBe('pdf');
  });

  it('detecta DOC legacy (OLE)', () => {
    expect(detectFormatByMagic(docBuffer())).toBe('doc');
  });

  it('detecta DOCX (ZIP/PK)', () => {
    expect(detectFormatByMagic(zipBuffer())).toBe('docx');
  });

  it('devuelve unknown para basura', () => {
    expect(detectFormatByMagic(randomBuffer(16))).toBe('unknown');
  });

  it('devuelve unknown si el buffer es demasiado corto', () => {
    expect(detectFormatByMagic(new Uint8Array([0x25]).buffer)).toBe('unknown');
  });
});

describe('extensionOf', () => {
  it('extrae extensión en minúsculas', () => {
    expect(extensionOf('CV_Juan.PDF')).toBe('pdf');
    expect(extensionOf('resume.docx')).toBe('docx');
  });

  it('devuelve vacío sin extensión', () => {
    expect(extensionOf('sin_extension')).toBe('');
  });
});

describe('validateCvFile', () => {
  it('acepta PDF válido', () => {
    const r = validateCvFile(pdfBuffer(100), 'application/pdf', 'cv.pdf');
    expect(r.ok).toBe(true);
    expect(r.format).toBe('pdf');
    expect(r.mimeType).toBe('application/pdf');
    expect(r.isLegacyDoc).toBe(false);
  });

  it('acepta DOCX válido (ZIP magic)', () => {
    const r = validateCvFile(
      zipBuffer(),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'cv.docx',
    );
    expect(r.ok).toBe(true);
    expect(r.format).toBe('docx');
  });

  it('acepta DOC legacy', () => {
    const r = validateCvFile(docBuffer(), 'application/msword', 'cv.doc');
    expect(r.ok).toBe(true);
    expect(r.format).toBe('doc');
    expect(r.isLegacyDoc).toBe(true);
  });

  it('rechaza archivo vacío', () => {
    const r = validateCvFile(new ArrayBuffer(0), 'application/pdf', 'cv.pdf');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/adjuntar/i);
  });

  it('rechaza archivo que supera MAX_CV_SIZE', () => {
    const r = validateCvFile(pdfBuffer(), 'application/pdf', 'huge.pdf', MAX_CV_SIZE + 1);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/5MB/i);
  });

  it('rechaza extensión no permitida', () => {
    const r = validateCvFile(pdfBuffer(), 'image/png', 'foto.png');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/PDF o Word/i);
  });

  it('rechaza PDF renombrado con magic inválido', () => {
    const r = validateCvFile(randomBuffer(64), 'application/pdf', 'fake.pdf');
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('rechaza extensión .pdf con contenido ZIP', () => {
    const r = validateCvFile(zipBuffer(), 'application/pdf', 'trampa.pdf');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no coincide/i);
  });

  it('tolera MIME genérico application/octet-stream si magic es PDF', () => {
    const r = validateCvFile(pdfBuffer(50), 'application/octet-stream', 'cv.pdf');
    expect(r.ok).toBe(true);
    expect(r.format).toBe('pdf');
  });
});

describe('storageExtension', () => {
  it('mapea formato a extensión de storage', () => {
    expect(storageExtension('pdf', 'x.bin')).toBe('pdf');
    expect(storageExtension('docx', 'x.bin')).toBe('docx');
    expect(storageExtension('doc', 'x.bin')).toBe('doc');
    expect(storageExtension('unknown', 'file.xyz')).toBe('xyz');
  });
});
