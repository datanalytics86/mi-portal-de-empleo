/**
 * Validaciones con Zod para Portal de Empleos Chile
 *
 * Schemas y funciones de validación para formularios y uploads
 * Basado en SPECIFICATIONS.md sección 8
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tipos MIME permitidos para CVs
 * Basado en SPECS 8.1
 */
export const ALLOWED_CV_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
] as const;

/**
 * Tamaño máximo de archivo CV: 5MB
 * Basado en SPECS 8.1
 */
export const MAX_CV_SIZE = 5 * 1024 * 1024; // 5MB en bytes

/**
 * Extensiones de archivo permitidas
 */
export const ALLOWED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

/**
 * Rate limit: máximo de postulaciones por IP por hora
 * Basado en SPECS 8.2
 */
export const MAX_POSTULATIONS_PER_HOUR = 3;

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS ZOD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema para validación de postulación (cliente)
 */
export const postulacionClientSchema = z.object({
  nombre_candidato: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .optional()
    .or(z.literal('')),

  email_candidato: z
    .string()
    .email('Email inválido')
    .max(255, 'El email no puede superar 255 caracteres')
    .optional()
    .or(z.literal('')),

  acepta_privacidad: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Debes aceptar la política de privacidad para continuar',
    }),
});

/**
 * Schema para validación de postulación (servidor)
 * Incluye validación de archivo
 */
export const postulacionServerSchema = postulacionClientSchema.extend({
  oferta_id: z.string().uuid('ID de oferta inválido'),
  cv_file: z.custom<File>((file) => file instanceof File, {
    message: 'Archivo inválido',
  }),
});

/**
 * Schema para validación de oferta (para uso futuro)
 */
export const ofertaSchema = z.object({
  titulo: z
    .string()
    .min(10, 'El título debe tener al menos 10 caracteres')
    .max(100, 'El título no puede superar 100 caracteres'),

  descripcion: z
    .string()
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(2000, 'La descripción no puede superar 2000 caracteres'),

  empresa: z
    .string()
    .min(2, 'El nombre de empresa debe tener al menos 2 caracteres')
    .max(100, 'El nombre de empresa no puede superar 100 caracteres'),

  tipo_jornada: z.enum(['Full-time', 'Part-time', 'Freelance', 'Práctica'], {
    errorMap: () => ({ message: 'Tipo de jornada inválido' }),
  }),

  categoria: z
    .string()
    .max(50, 'La categoría no puede superar 50 caracteres')
    .optional(),

  comuna: z
    .string()
    .min(2, 'La comuna es requerida')
    .max(100, 'La comuna no puede superar 100 caracteres'),
});

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS TYPESCRIPT
// ═══════════════════════════════════════════════════════════════════════════

export type PostulacionClient = z.infer<typeof postulacionClientSchema>;
export type PostulacionServer = z.infer<typeof postulacionServerSchema>;
export type Oferta = z.infer<typeof ofertaSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valida un archivo CV en el cliente
 * Basado en SPECS 8.1
 *
 * @param file - Archivo a validar
 * @returns string con mensaje de error o null si es válido
 */
export function validateCVFile(file: File): string | null {
  // Validar tipo MIME
  if (!ALLOWED_CV_TYPES.includes(file.type as any)) {
    return 'Solo se aceptan archivos PDF o Word (.doc, .docx)';
  }

  // Validar tamaño
  if (file.size > MAX_CV_SIZE) {
    const sizeMB = (MAX_CV_SIZE / 1024 / 1024).toFixed(0);
    return `El archivo no puede superar ${sizeMB}MB`;
  }

  // Validar extensión (seguridad adicional)
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_CV_EXTENSIONS.includes(extension as any)) {
    return 'Extensión de archivo no permitida';
  }

  return null;
}

/**
 * Valida un archivo CV en el servidor (más estricto)
 *
 * @param file - Archivo a validar
 * @param buffer - Buffer del archivo (opcional, para validación de contenido)
 * @returns objeto con isValid y error
 */
export function validateCVFileServer(
  file: File,
  buffer?: ArrayBuffer
): { isValid: boolean; error: string | null } {
  // Validaciones básicas
  const clientError = validateCVFile(file);
  if (clientError) {
    return { isValid: false, error: clientError };
  }

  // Validación adicional de nombre de archivo
  const fileName = file.name;
  if (fileName.length > 255) {
    return { isValid: false, error: 'Nombre de archivo demasiado largo' };
  }

  // Verificar caracteres peligrosos en nombre
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(fileName)) {
    return { isValid: false, error: 'Nombre de archivo contiene caracteres no permitidos' };
  }

  // TODO: Si se proporciona buffer, validar magic bytes para mayor seguridad
  // Esto previene que alguien renombre un archivo malicioso

  return { isValid: true, error: null };
}

/**
 * Genera nombre único para archivo CV
 * Formato: timestamp_uuid_sanitizedName.ext
 *
 * @param originalName - Nombre original del archivo
 * @returns Nombre sanitizado y único
 */
export function generateUniqueCVFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().split('-')[0]; // Primeros 8 caracteres

  // Extraer extensión
  const extension = originalName.split('.').pop()?.toLowerCase() || 'pdf';

  // Sanitizar nombre original (quitar espacios y caracteres especiales)
  const sanitizedName = originalName
    .replace(/\.[^/.]+$/, '') // Quitar extensión
    .replace(/[^a-zA-Z0-9]/g, '_') // Reemplazar caracteres especiales
    .substring(0, 50); // Máximo 50 caracteres

  return `${timestamp}_${randomId}_${sanitizedName}.${extension}`;
}

/**
 * Formatea el tamaño de archivo a formato legible
 *
 * @param bytes - Tamaño en bytes
 * @returns String formateado (ej: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Valida email con regex adicional
 *
 * @param email - Email a validar
 * @returns true si es válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitiza texto para prevenir XSS
 *
 * @param text - Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
