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

/** Quiet Opportunity: categories are monochrome. One accent on the map. */
const CATEGORIA_SURFACE =
  'bg-muted text-muted-foreground border-border';

export const CATEGORIA_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((c) => [c, CATEGORIA_SURFACE]),
);

/** Deep teal — oklch(0.70 0.062 185) on dark, used by Leaflet markers */
export const BRAND_HEX = '#6aa8a2';

export const CATEGORIA_HEX: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((c) => [c, BRAND_HEX]),
);

export const MAP_TILE_DARK =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const MAP_TILE_LIGHT =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
