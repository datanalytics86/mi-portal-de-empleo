import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Función helper para sanitizar strings
const sanitizeString = (val: string) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] });

// ============================================
// Schemas de Validación
// ============================================

/**
 * Schema para validar postulaciones
 * Nombre y email son opcionales para reducir fricción
 */
export const PostulacionSchema = z.object({
  nombre: z
    .string()
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform(sanitizeString)
    .optional(),
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .max(255, 'El email es demasiado largo')
    .optional(),
  ofertaId: z.string().uuid('ID de oferta inválido'),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política de privacidad' }),
  }),
});

export type PostulacionInput = z.infer<typeof PostulacionSchema>;

/**
 * Schema para validar ofertas de empleo
 */
export const OfertaSchema = z.object({
  titulo: z
    .string()
    .min(10, 'El título debe tener al menos 10 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres')
    .transform(sanitizeString),
  descripcion: z
    .string()
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .transform(sanitizeString),
  empresa: z
    .string()
    .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
    .max(100, 'El nombre de la empresa no puede exceder 100 caracteres')
    .transform(sanitizeString),
  tipo_jornada: z.enum(['Full-time', 'Part-time', 'Freelance', 'Práctica'], {
    errorMap: () => ({ message: 'Tipo de jornada inválido' }),
  }),
  categoria: z
    .string()
    .min(2, 'La categoría es requerida')
    .max(50, 'La categoría no puede exceder 50 caracteres')
    .transform(sanitizeString),
  comuna: z
    .string()
    .min(2, 'La comuna es requerida')
    .max(100, 'La comuna no puede exceder 100 caracteres')
    .transform(sanitizeString),
  expires_at: z
    .string()
    .datetime()
    .optional()
    .default(() => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString();
    }),
});

export type OfertaInput = z.infer<typeof OfertaSchema>;

/**
 * Schema para registro de empleadores
 */
export const EmpleadorRegistroSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .max(255, 'El email es demasiado largo'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  nombre_empresa: z
    .string()
    .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
    .max(100, 'El nombre de la empresa no puede exceder 100 caracteres')
    .transform(sanitizeString),
});

export type EmpleadorRegistroInput = z.infer<typeof EmpleadorRegistroSchema>;

/**
 * Schema para login de empleadores
 */
export const EmpleadorLoginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type EmpleadorLoginInput = z.infer<typeof EmpleadorLoginSchema>;

/**
 * Schema para validación de archivos CV
 */
export const CVFileSchema = z.object({
  name: z.string(),
  size: z
    .number()
    .max(5 * 1024 * 1024, 'El archivo no puede superar 5MB')
    .positive('Tamaño de archivo inválido'),
  type: z.enum(
    [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    {
      errorMap: () => ({ message: 'Solo se aceptan archivos PDF o Word (.doc, .docx)' }),
    }
  ),
});

export type CVFileInput = z.infer<typeof CVFileSchema>;

/**
 * Schema para filtros de búsqueda
 */
export const FiltrosBusquedaSchema = z.object({
  q: z.string().max(200, 'La búsqueda es demasiado larga').optional(),
  comuna: z.string().max(100).optional(),
  tipo_jornada: z
    .enum(['Full-time', 'Part-time', 'Freelance', 'Práctica'])
    .optional(),
  categoria: z.string().max(50).optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

export type FiltrosBusquedaInput = z.infer<typeof FiltrosBusquedaSchema>;
