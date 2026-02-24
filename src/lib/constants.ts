export const TIPOS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'freelance': 'Freelance',
  'practica': 'Práctica',
};

export const CATEGORIAS = [
  'Tecnología', 'Ventas', 'Marketing', 'Finanzas', 'Administración',
  'Salud', 'Educación', 'Operaciones', 'Diseño', 'Legal', 'Otro',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];
