import { z } from 'zod';

/** Estado del pipeline de parsing del CV */
export const ParseStatusSchema = z.enum(['pending', 'success', 'failed', 'skipped']);
export type ParseStatus = z.infer<typeof ParseStatusSchema>;

export const ExperienciaSchema = z.object({
  empresa: z.string().nullable().default(null),
  cargo: z.string().nullable().default(null),
  fecha_inicio: z.string().nullable().default(null),
  fecha_fin: z.string().nullable().default(null),
  descripcion: z.string().nullable().default(null),
});
export type ExperienciaLaboral = z.infer<typeof ExperienciaSchema>;

export const EducacionSchema = z.object({
  institucion: z.string().nullable().default(null),
  titulo: z.string().nullable().default(null),
  fecha: z.string().nullable().default(null),
  descripcion: z.string().nullable().default(null),
});
export type Educacion = z.infer<typeof EducacionSchema>;

export const IdiomaSchema = z.object({
  idioma: z.string(),
  nivel: z.string().nullable().default(null),
});
export type Idioma = z.infer<typeof IdiomaSchema>;

/** Objeto estructurado completo extraído del CV (cv_parsed jsonb) */
export const CvParsedSchema = z.object({
  nombre_completo: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  telefono: z.string().nullable().default(null),
  titulo_profesional: z.string().nullable().default(null),
  resumen: z.string().nullable().default(null),
  experiencia: z.array(ExperienciaSchema).default([]),
  educacion: z.array(EducacionSchema).default([]),
  skills_tecnicas: z.array(z.string()).default([]),
  skills_blandas: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  idiomas: z.array(IdiomaSchema).default([]),
  anos_experiencia: z.number().nullable().default(null),
  ubicacion: z.string().nullable().default(null),
  parse_method: z.enum(['rule', 'llm', 'hybrid', 'ocr']).default('rule'),
  /** true si el texto del CV se obtuvo (parcial o total) vía OCR */
  used_ocr: z.boolean().default(false),
  ocr_engine: z.enum(['ocr_space', 'tesseract', 'none']).nullable().default(null),
  raw_text_length: z.number().int().nonnegative().default(0),
  warnings: z.array(z.string()).default([]),
});
export type CvParsed = z.infer<typeof CvParsedSchema>;

export interface ParseCvInput {
  buffer: ArrayBuffer;
  mimeType: string;
  fileName?: string;
  /** Nombre/email del formulario (se usan como fallback) */
  formNombre?: string | null;
  formEmail?: string | null;
  /** Descripción de la oferta para match score (opcional) */
  ofertaTexto?: string | null;
}

export interface ParseCvResult {
  status: ParseStatus;
  cv_parsed: CvParsed | null;
  keywords: string[];
  match_score: number | null;
  error?: string;
}

export function emptyCvParsed(partial: Partial<CvParsed> = {}): CvParsed {
  return CvParsedSchema.parse(partial);
}
