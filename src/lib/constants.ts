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

// Clases Tailwind completas (necesario para que el JIT las detecte)
export const CATEGORIA_COLORS: Record<string, string> = {
  'Tecnología':    'bg-blue-50 text-blue-700 border-blue-100',
  'Ventas':        'bg-amber-50 text-amber-700 border-amber-100',
  'Marketing':     'bg-pink-50 text-pink-700 border-pink-100',
  'Finanzas':      'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Administración':'bg-violet-50 text-violet-700 border-violet-100',
  'Salud':         'bg-teal-50 text-teal-700 border-teal-100',
  'Educación':     'bg-orange-50 text-orange-700 border-orange-100',
  'Operaciones':   'bg-cyan-50 text-cyan-700 border-cyan-100',
  'Diseño':        'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  'Legal':         'bg-slate-100 text-slate-700 border-slate-200',
  'Otro':          'bg-gray-100 text-gray-600 border-gray-200',
};
