/**
 * Comunas de Chile con coordenadas geográficas
 * Datos extraídos de fuentes públicas y OpenStreetMap
 */

export interface Comuna {
  nombre: string;
  region: string;
  lat: number;
  lng: number;
}

export const comunasChile: Comuna[] = [
  // Región Metropolitana
  { nombre: 'Santiago', region: 'Metropolitana', lat: -33.4489, lng: -70.6693 },
  { nombre: 'Providencia', region: 'Metropolitana', lat: -33.4297, lng: -70.6103 },
  { nombre: 'Las Condes', region: 'Metropolitana', lat: -33.4172, lng: -70.5836 },
  { nombre: 'Vitacura', region: 'Metropolitana', lat: -33.3828, lng: -70.5753 },
  { nombre: 'Lo Barnechea', region: 'Metropolitana', lat: -33.3487, lng: -70.5078 },
  { nombre: 'Ñuñoa', region: 'Metropolitana', lat: -33.4569, lng: -70.5969 },
  { nombre: 'La Reina', region: 'Metropolitana', lat: -33.4453, lng: -70.5392 },
  { nombre: 'Macul', region: 'Metropolitana', lat: -33.4861, lng: -70.5956 },
  { nombre: 'Peñalolén', region: 'Metropolitana', lat: -33.4894, lng: -70.5428 },
  { nombre: 'La Florida', region: 'Metropolitana', lat: -33.5231, lng: -70.5989 },
  { nombre: 'Puente Alto', region: 'Metropolitana', lat: -33.6103, lng: -70.5756 },
  { nombre: 'San Bernardo', region: 'Metropolitana', lat: -33.5928, lng: -70.7003 },
  { nombre: 'Maipú', region: 'Metropolitana', lat: -33.5108, lng: -70.7575 },
  { nombre: 'Pudahuel', region: 'Metropolitana', lat: -33.4403, lng: -70.7464 },
  { nombre: 'Quilicura', region: 'Metropolitana', lat: -33.3606, lng: -70.7325 },
  { nombre: 'Renca', region: 'Metropolitana', lat: -33.4044, lng: -70.7219 },
  { nombre: 'Cerro Navia', region: 'Metropolitana', lat: -33.4258, lng: -70.7411 },
  { nombre: 'Lo Prado', region: 'Metropolitana', lat: -33.4439, lng: -70.7194 },
  { nombre: 'Quinta Normal', region: 'Metropolitana', lat: -33.4294, lng: -70.6994 },
  { nombre: 'Estación Central', region: 'Metropolitana', lat: -33.4594, lng: -70.6833 },
  { nombre: 'Cerrillos', region: 'Metropolitana', lat: -33.4972, lng: -70.7081 },
  { nombre: 'Pedro Aguirre Cerda', region: 'Metropolitana', lat: -33.4919, lng: -70.6717 },
  { nombre: 'San Miguel', region: 'Metropolitana', lat: -33.4958, lng: -70.6467 },
  { nombre: 'La Cisterna', region: 'Metropolitana', lat: -33.5328, lng: -70.6611 },
  { nombre: 'San Joaquín', region: 'Metropolitana', lat: -33.4978, lng: -70.6228 },
  { nombre: 'La Granja', region: 'Metropolitana', lat: -33.5381, lng: -70.6219 },
  { nombre: 'El Bosque', region: 'Metropolitana', lat: -33.5636, lng: -70.6742 },
  { nombre: 'San Ramón', region: 'Metropolitana', lat: -33.5372, lng: -70.6444 },
  { nombre: 'La Pintana', region: 'Metropolitana', lat: -33.5883, lng: -70.6342 },

  // Valparaíso
  { nombre: 'Valparaíso', region: 'Valparaíso', lat: -33.0472, lng: -71.6127 },
  { nombre: 'Viña del Mar', region: 'Valparaíso', lat: -33.0245, lng: -71.5518 },
  { nombre: 'Quilpué', region: 'Valparaíso', lat: -33.0472, lng: -71.4419 },
  { nombre: 'Villa Alemana', region: 'Valparaíso', lat: -33.0444, lng: -71.3731 },
  { nombre: 'Concón', region: 'Valparaíso', lat: -32.9253, lng: -71.5208 },
  { nombre: 'Casablanca', region: 'Valparaíso', lat: -33.3167, lng: -71.4167 },
  { nombre: 'San Antonio', region: 'Valparaíso', lat: -33.5953, lng: -71.6178 },
  { nombre: 'Quillota', region: 'Valparaíso', lat: -32.8806, lng: -71.2478 },
  { nombre: 'La Calera', region: 'Valparaíso', lat: -32.7881, lng: -71.2025 },
  { nombre: 'Los Andes', region: 'Valparaíso', lat: -32.8339, lng: -70.5986 },
  { nombre: 'San Felipe', region: 'Valparaíso', lat: -32.7500, lng: -70.7250 },

  // Biobío
  { nombre: 'Concepción', region: 'Biobío', lat: -36.8201, lng: -73.0444 },
  { nombre: 'Talcahuano', region: 'Biobío', lat: -36.7167, lng: -73.1167 },
  { nombre: 'Hualpén', region: 'Biobío', lat: -36.7833, lng: -73.0833 },
  { nombre: 'Chiguayante', region: 'Biobío', lat: -36.9167, lng: -73.0333 },
  { nombre: 'San Pedro de la Paz', region: 'Biobío', lat: -36.8333, lng: -73.1167 },
  { nombre: 'Coronel', region: 'Biobío', lat: -37.0333, lng: -73.1500 },
  { nombre: 'Los Ángeles', region: 'Biobío', lat: -37.4689, lng: -72.3527 },
  { nombre: 'Chillán', region: 'Ñuble', lat: -36.6066, lng: -72.1034 },

  // Coquimbo
  { nombre: 'La Serena', region: 'Coquimbo', lat: -29.9027, lng: -71.2519 },
  { nombre: 'Coquimbo', region: 'Coquimbo', lat: -29.9533, lng: -71.3436 },
  { nombre: 'Ovalle', region: 'Coquimbo', lat: -30.6014, lng: -71.1989 },
  { nombre: 'Illapel', region: 'Coquimbo', lat: -31.6333, lng: -71.1667 },

  // Antofagasta
  { nombre: 'Antofagasta', region: 'Antofagasta', lat: -23.6509, lng: -70.3975 },
  { nombre: 'Calama', region: 'Antofagasta', lat: -22.4667, lng: -68.9333 },
  { nombre: 'Tocopilla', region: 'Antofagasta', lat: -22.0917, lng: -70.1989 },
  { nombre: 'Mejillones', region: 'Antofagasta', lat: -23.1000, lng: -70.4500 },

  // Araucanía
  { nombre: 'Temuco', region: 'Araucanía', lat: -38.7359, lng: -72.5904 },
  { nombre: 'Padre Las Casas', region: 'Araucanía', lat: -38.7500, lng: -72.5833 },
  { nombre: 'Villarrica', region: 'Araucanía', lat: -39.2833, lng: -72.2333 },
  { nombre: 'Pucón', region: 'Araucanía', lat: -39.2828, lng: -71.9553 },

  // O'Higgins
  { nombre: 'Rancagua', region: "O'Higgins", lat: -34.1708, lng: -70.7407 },
  { nombre: 'San Fernando', region: "O'Higgins", lat: -34.5833, lng: -70.9833 },
  { nombre: 'Machalí', region: "O'Higgins", lat: -34.1833, lng: -70.6500 },
  { nombre: 'Rengo', region: "O'Higgins", lat: -34.4000, lng: -70.8667 },
  { nombre: 'Santa Cruz', region: "O'Higgins", lat: -34.6333, lng: -71.3667 },

  // Maule
  { nombre: 'Talca', region: 'Maule', lat: -35.4264, lng: -71.6554 },
  { nombre: 'Curicó', region: 'Maule', lat: -34.9830, lng: -71.2394 },
  { nombre: 'Linares', region: 'Maule', lat: -35.8500, lng: -71.6000 },
  { nombre: 'Cauquenes', region: 'Maule', lat: -35.9667, lng: -72.3167 },
  { nombre: 'Constitución', region: 'Maule', lat: -35.3333, lng: -72.4167 },

  // Arica y Parinacota
  { nombre: 'Arica', region: 'Arica y Parinacota', lat: -18.4746, lng: -70.2979 },
  { nombre: 'Putre', region: 'Arica y Parinacota', lat: -18.1950, lng: -69.5583 },

  // Tarapacá
  { nombre: 'Iquique', region: 'Tarapacá', lat: -20.2307, lng: -70.1435 },
  { nombre: 'Alto Hospicio', region: 'Tarapacá', lat: -20.2667, lng: -70.1000 },
  { nombre: 'Pozo Almonte', region: 'Tarapacá', lat: -20.2594, lng: -69.7875 },

  // Atacama
  { nombre: 'Copiapó', region: 'Atacama', lat: -27.3668, lng: -70.3323 },
  { nombre: 'Caldera', region: 'Atacama', lat: -27.0667, lng: -70.8167 },
  { nombre: 'Vallenar', region: 'Atacama', lat: -28.5756, lng: -70.7575 },

  // Los Lagos
  { nombre: 'Puerto Montt', region: 'Los Lagos', lat: -41.4693, lng: -72.9424 },
  { nombre: 'Osorno', region: 'Los Lagos', lat: -40.5736, lng: -73.1322 },
  { nombre: 'Castro', region: 'Los Lagos', lat: -42.4792, lng: -73.7625 },
  { nombre: 'Ancud', region: 'Los Lagos', lat: -41.8708, lng: -73.8244 },
  { nombre: 'Puerto Varas', region: 'Los Lagos', lat: -41.3189, lng: -72.9833 },

  // Los Ríos
  { nombre: 'Valdivia', region: 'Los Ríos', lat: -39.8142, lng: -73.2459 },
  { nombre: 'La Unión', region: 'Los Ríos', lat: -40.2931, lng: -73.0833 },
  { nombre: 'Río Bueno', region: 'Los Ríos', lat: -40.3333, lng: -72.9500 },

  // Aysén
  { nombre: 'Coyhaique', region: 'Aysén', lat: -45.5752, lng: -72.0662 },
  { nombre: 'Puerto Aysén', region: 'Aysén', lat: -45.4028, lng: -72.6958 },
  { nombre: 'Chile Chico', region: 'Aysén', lat: -46.5417, lng: -71.7225 },

  // Magallanes
  { nombre: 'Punta Arenas', region: 'Magallanes', lat: -53.1638, lng: -70.9171 },
  { nombre: 'Puerto Natales', region: 'Magallanes', lat: -51.7308, lng: -72.5050 },
  { nombre: 'Porvenir', region: 'Magallanes', lat: -53.2967, lng: -70.3672 },
];

/**
 * Obtiene una comuna por su nombre
 */
export function getComunaByName(nombre: string): Comuna | undefined {
  return comunasChile.find(
    (c) => c.nombre.toLowerCase() === nombre.toLowerCase()
  );
}

/**
 * Obtiene todas las comunas de una región
 */
export function getComunasByRegion(region: string): Comuna[] {
  return comunasChile.filter(
    (c) => c.region.toLowerCase() === region.toLowerCase()
  );
}

/**
 * Obtiene todas las regiones únicas
 */
export function getRegiones(): string[] {
  const regiones = new Set(comunasChile.map((c) => c.region));
  return Array.from(regiones).sort();
}

/**
 * Categorías de ofertas laborales
 */
export const categorias = [
  'Tecnología',
  'Ventas',
  'Administración',
  'Marketing',
  'Finanzas',
  'Recursos Humanos',
  'Ingeniería',
  'Salud',
  'Educación',
  'Logística',
  'Construcción',
  'Gastronomía',
  'Turismo',
  'Legal',
  'Diseño',
  'Atención al Cliente',
  'Producción',
  'Otros',
] as const;

export type Categoria = (typeof categorias)[number];

/**
 * Tipos de jornada laboral
 */
export const tiposJornada = ['Full-time', 'Part-time', 'Freelance', 'Práctica'] as const;

export type TipoJornada = (typeof tiposJornada)[number];
