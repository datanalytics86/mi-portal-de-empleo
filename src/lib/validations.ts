import { z } from 'zod';

// Validación de postulación
export const postulacionSchema = z.object({
  nombre_candidato: z.string().optional(),
  email_candidato: z.string().email('Email inválido').optional(),
  cv: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'El archivo no puede superar 5MB',
    })
    .refine(
      (file) =>
        [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ].includes(file.type),
      {
        message: 'Solo se aceptan archivos PDF o Word',
      }
    ),
  acepta_privacidad: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política de privacidad' }),
  }),
});

export type PostulacionData = z.infer<typeof postulacionSchema>;

// Validación de oferta
export const ofertaSchema = z.object({
  titulo: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  descripcion: z
    .string()
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(2000, 'La descripción no puede superar 2000 caracteres'),
  empresa: z.string().min(2, 'El nombre de la empresa es requerido'),
  tipo_jornada: z.enum(['Full-time', 'Part-time', 'Freelance', 'Práctica']),
  categoria: z.string().optional(),
  comuna: z.string().min(1, 'Debes seleccionar una comuna'),
  expires_at: z.string().optional(),
});

export type OfertaData = z.infer<typeof ofertaSchema>;

// Validación de registro de empleador
export const empleadorRegistroSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre_empresa: z.string().min(2, 'El nombre de la empresa es requerido'),
});

export type EmpleadorRegistroData = z.infer<typeof empleadorRegistroSchema>;

// Validación de login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginData = z.infer<typeof loginSchema>;

// Validación de búsqueda/filtros
export const filtrosSchema = z.object({
  q: z.string().optional(),
  tipo_jornada: z.array(z.string()).optional(),
  comuna: z.string().optional(),
  categoria: z.string().optional(),
});

export type FiltrosData = z.infer<typeof filtrosSchema>;

// Categorías de trabajo
export const categorias = [
  'Tecnología',
  'Ventas',
  'Administración',
  'Marketing',
  'Diseño',
  'Recursos Humanos',
  'Finanzas',
  'Logística',
  'Educación',
  'Salud',
  'Construcción',
  'Turismo',
  'Gastronomía',
  'Servicio al Cliente',
  'Producción',
  'Otro',
] as const;

export type Categoria = (typeof categorias)[number];
