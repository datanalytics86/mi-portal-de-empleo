export const TIPOS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  freelance: 'Freelance',
  practica: 'Práctica',
};

export const CATEGORIAS = [
  'Tecnología', 'Ventas', 'Marketing', 'Finanzas', 'Administración',
  'Salud', 'Educación', 'Operaciones', 'Diseño', 'Legal', 'Otro',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

const CATEGORIA_SURFACE =
  'bg-muted text-muted-foreground border-border';

export const CATEGORIA_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((c) => [c, CATEGORIA_SURFACE]),
);

/** Trust blue — oklch(0.50 0.14 245), Leaflet markers */
export const BRAND_HEX = '#1570ef';

export const CATEGORIA_HEX: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((c) => [c, BRAND_HEX]),
);

export const MAP_TILE_LIGHT =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
