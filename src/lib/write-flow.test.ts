import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateCvFile } from './cv-parser/file-validation';
import { recommendOfertas } from './recommend';

const EnlistSchema = z.object({
  nombre: z.string().max(100).optional().nullable(),
  email: z
    .union([z.string().email().max(200), z.literal(''), z.null()])
    .optional(),
});

const PostulacionSchema = z.object({
  oferta_id: z.string().uuid('ID de oferta inválido'),
  nombre: z.string().max(100).optional().nullable(),
  email: z
    .union([z.string().email().max(200), z.literal(''), z.null()])
    .optional(),
});

function txtBuffer(): ArrayBuffer {
  return new TextEncoder().encode('hola').buffer;
}

function pdfBuffer(): ArrayBuffer {
  const header = new TextEncoder().encode('%PDF-1.4\n');
  return header.buffer;
}

describe('contrato de escritura /api/enlist y /api/postulaciones', () => {
  it('rechaza CV vacío o .txt (400)', () => {
    const empty = validateCvFile(new ArrayBuffer(0), 'text/plain', 'cv.txt', 0);
    expect(empty.ok).toBe(false);
    expect(empty.error).toMatch(/adjuntar|CV/i);

    const txt = validateCvFile(txtBuffer(), 'text/plain', 'notas.txt', 4);
    expect(txt.ok).toBe(false);
    expect(txt.error).toMatch(/PDF|Word|válido|aceptan/i);
  });

  it('acepta PDF con magic bytes', () => {
    const pdf = validateCvFile(pdfBuffer(), 'application/pdf', 'cv.pdf', 8);
    expect(pdf.ok).toBe(true);
    expect(pdf.format).toBe('pdf');
  });

  it('rechaza oferta_id que no es UUID', () => {
    const parsed = PostulacionSchema.safeParse({ oferta_id: 'no-existe', nombre: null, email: null });
    expect(parsed.success).toBe(false);
  });

  it('acepta email vacío en enlist (opcional)', () => {
    expect(EnlistSchema.safeParse({ nombre: 'Ana', email: '' }).success).toBe(true);
    expect(EnlistSchema.safeParse({ nombre: null, email: 'no-es-mail' }).success).toBe(false);
  });

  it('tras keywords, el matching devuelve ofertas con id demo estable', () => {
    const recs = recommendOfertas({ keywords: ['React', 'TypeScript'], limit: 6 });
    expect(recs.length).toBeGreaterThanOrEqual(1);
    expect(recs.length).toBeLessThanOrEqual(6);
    expect(recs[0]!.id).toMatch(/^eeeeeeee-0000-4000-8000-/);
    expect(recs[0]!.titulo.length).toBeGreaterThan(3);
    expect(recs[0]!.match_score).toBeGreaterThan(0);
  });

  it('sin keywords, /api/enlist puede devolver matches vacíos sin fallar', () => {
    expect(recommendOfertas({ keywords: [] })).toEqual([]);
  });
});
