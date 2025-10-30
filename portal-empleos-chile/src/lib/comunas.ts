/**
 * Datos de referencia: Comunas de Chile con coordenadas
 *
 * Lista de comunas chilenas con sus coordenadas geográficas para
 * georeferenciación en el mapa y formularios de ofertas.
 *
 * Basado en SPECIFICATIONS.md sección 7
 *
 * TODO: Expandir a las 346 comunas completas de Chile
 */

export interface Comuna {
  nombre: string;
  region: string;
  lat: number;
  lng: number;
}

/**
 * Array de comunas principales de Chile (ordenadas por región de norte a sur)
 * Incluye las principales ciudades y comunas de cada región
 */
export const comunasChile: Comuna[] = [
  // Región de Arica y Parinacota
  { nombre: 'Arica', region: 'Arica y Parinacota', lat: -18.4746, lng: -70.2979 },
  { nombre: 'Putre', region: 'Arica y Parinacota', lat: -18.1951, lng: -69.5581 },
  { nombre: 'Camarones', region: 'Arica y Parinacota', lat: -19.0106, lng: -69.8619 },

  // Región de Tarapacá
  { nombre: 'Iquique', region: 'Tarapacá', lat: -20.2307, lng: -70.1435 },
  { nombre: 'Alto Hospicio', region: 'Tarapacá', lat: -20.2649, lng: -70.0997 },
  { nombre: 'Pozo Almonte', region: 'Tarapacá', lat: -20.2593, lng: -69.7889 },
  { nombre: 'Pica', region: 'Tarapacá', lat: -20.4926, lng: -69.3292 },

  // Región de Antofagasta
  { nombre: 'Antofagasta', region: 'Antofagasta', lat: -23.6509, lng: -70.3975 },
  { nombre: 'Calama', region: 'Antofagasta', lat: -22.4663, lng: -68.9248 },
  { nombre: 'Tocopilla', region: 'Antofagasta', lat: -22.0918, lng: -70.1981 },
  { nombre: 'Mejillones', region: 'Antofagasta', lat: -23.0996, lng: -70.4490 },
  { nombre: 'Taltal', region: 'Antofagasta', lat: -25.4057, lng: -70.4839 },

  // Región de Atacama
  { nombre: 'Copiapó', region: 'Atacama', lat: -27.3668, lng: -70.3323 },
  { nombre: 'Vallenar', region: 'Atacama', lat: -28.5745, lng: -70.7599 },
  { nombre: 'Chañaral', region: 'Atacama', lat: -26.3481, lng: -70.6222 },
  { nombre: 'Caldera', region: 'Atacama', lat: -27.0665, lng: -70.8250 },
  { nombre: 'Diego de Almagro', region: 'Atacama', lat: -26.3865, lng: -70.0493 },

  // Región de Coquimbo
  { nombre: 'La Serena', region: 'Coquimbo', lat: -29.9027, lng: -71.2519 },
  { nombre: 'Coquimbo', region: 'Coquimbo', lat: -29.9533, lng: -71.3394 },
  { nombre: 'Ovalle', region: 'Coquimbo', lat: -30.6011, lng: -71.1991 },
  { nombre: 'Illapel', region: 'Coquimbo', lat: -31.6329, lng: -71.1689 },
  { nombre: 'Vicuña', region: 'Coquimbo', lat: -30.0336, lng: -70.7123 },
  { nombre: 'Andacollo', region: 'Coquimbo', lat: -30.2261, lng: -71.0818 },

  // Región de Valparaíso
  { nombre: 'Valparaíso', region: 'Valparaíso', lat: -33.0472, lng: -71.6127 },
  { nombre: 'Viña del Mar', region: 'Valparaíso', lat: -33.0244, lng: -71.5517 },
  { nombre: 'Quilpué', region: 'Valparaíso', lat: -33.0472, lng: -71.4419 },
  { nombre: 'Villa Alemana', region: 'Valparaíso', lat: -33.0444, lng: -71.3733 },
  { nombre: 'Concón', region: 'Valparaíso', lat: -32.9253, lng: -71.5210 },
  { nombre: 'Quillota', region: 'Valparaíso', lat: -32.8833, lng: -71.2500 },
  { nombre: 'San Antonio', region: 'Valparaíso', lat: -33.5956, lng: -71.6128 },
  { nombre: 'Los Andes', region: 'Valparaíso', lat: -32.8336, lng: -70.5986 },
  { nombre: 'San Felipe', region: 'Valparaíso', lat: -32.7500, lng: -70.7333 },
  { nombre: 'Limache', region: 'Valparaíso', lat: -33.0106, lng: -71.2689 },
  { nombre: 'La Calera', region: 'Valparaíso', lat: -32.7880, lng: -71.2044 },
  { nombre: 'Casablanca', region: 'Valparaíso', lat: -33.3167, lng: -71.4167 },

  // Región Metropolitana de Santiago
  { nombre: 'Santiago', region: 'Metropolitana', lat: -33.4489, lng: -70.6693 },
  { nombre: 'Providencia', region: 'Metropolitana', lat: -33.4333, lng: -70.6167 },
  { nombre: 'Las Condes', region: 'Metropolitana', lat: -33.4167, lng: -70.5833 },
  { nombre: 'Vitacura', region: 'Metropolitana', lat: -33.3833, lng: -70.5667 },
  { nombre: 'La Reina', region: 'Metropolitana', lat: -33.4500, lng: -70.5333 },
  { nombre: 'Ñuñoa', region: 'Metropolitana', lat: -33.4564, lng: -70.5981 },
  { nombre: 'Macul', region: 'Metropolitana', lat: -33.4889, lng: -70.5972 },
  { nombre: 'Peñalolén', region: 'Metropolitana', lat: -33.4889, lng: -70.5428 },
  { nombre: 'La Florida', region: 'Metropolitana', lat: -33.5222, lng: -70.5981 },
  { nombre: 'Maipú', region: 'Metropolitana', lat: -33.5106, lng: -70.7575 },
  { nombre: 'Puente Alto', region: 'Metropolitana', lat: -33.6106, lng: -70.5756 },
  { nombre: 'San Bernardo', region: 'Metropolitana', lat: -33.5928, lng: -70.7008 },
  { nombre: 'Renca', region: 'Metropolitana', lat: -33.4044, lng: -70.7281 },
  { nombre: 'Quilicura', region: 'Metropolitana', lat: -33.3594, lng: -70.7339 },
  { nombre: 'Huechuraba', region: 'Metropolitana', lat: -33.3683, lng: -70.6331 },
  { nombre: 'Recoleta', region: 'Metropolitana', lat: -33.4167, lng: -70.6333 },
  { nombre: 'Independencia', region: 'Metropolitana', lat: -33.4167, lng: -70.6667 },
  { nombre: 'Conchalí', region: 'Metropolitana', lat: -33.3833, lng: -70.6750 },
  { nombre: 'Estación Central', region: 'Metropolitana', lat: -33.4597, lng: -70.6828 },
  { nombre: 'Pudahuel', region: 'Metropolitana', lat: -33.4403, lng: -70.7492 },
  { nombre: 'Cerrillos', region: 'Metropolitana', lat: -33.4972, lng: -70.7103 },
  { nombre: 'Lo Prado', region: 'Metropolitana', lat: -33.4458, lng: -70.7239 },
  { nombre: 'Quinta Normal', region: 'Metropolitana', lat: -33.4333, lng: -70.6972 },
  { nombre: 'San Miguel', region: 'Metropolitana', lat: -33.4972, lng: -70.6500 },
  { nombre: 'La Cisterna', region: 'Metropolitana', lat: -33.5319, lng: -70.6617 },
  { nombre: 'San Joaquín', region: 'Metropolitana', lat: -33.4972, lng: -70.6306 },
  { nombre: 'Pedro Aguirre Cerda', region: 'Metropolitana', lat: -33.4944, lng: -70.6797 },
  { nombre: 'Lo Espejo', region: 'Metropolitana', lat: -33.5217, lng: -70.6889 },
  { nombre: 'El Bosque', region: 'Metropolitana', lat: -33.5631, lng: -70.6764 },
  { nombre: 'La Pintana', region: 'Metropolitana', lat: -33.5844, lng: -70.6347 },
  { nombre: 'San Ramón', region: 'Metropolitana', lat: -33.5369, lng: -70.6403 },
  { nombre: 'La Granja', region: 'Metropolitana', lat: -33.5383, lng: -70.6200 },
  { nombre: 'Colina', region: 'Metropolitana', lat: -33.2000, lng: -70.6667 },
  { nombre: 'Lampa', region: 'Metropolitana', lat: -33.2833, lng: -70.8833 },
  { nombre: 'Melipilla', region: 'Metropolitana', lat: -33.6833, lng: -71.2167 },
  { nombre: 'Talagante', region: 'Metropolitana', lat: -33.6667, lng: -70.9333 },
  { nombre: 'Peñaflor', region: 'Metropolitana', lat: -33.6097, lng: -70.9094 },
  { nombre: 'Buin', region: 'Metropolitana', lat: -33.7319, lng: -70.7439 },
  { nombre: 'Paine', region: 'Metropolitana', lat: -33.8119, lng: -70.7408 },

  // Región de O'Higgins
  { nombre: 'Rancagua', region: "O'Higgins", lat: -34.1708, lng: -70.7407 },
  { nombre: 'San Fernando', region: "O'Higgins", lat: -34.5875, lng: -70.9889 },
  { nombre: 'Rengo', region: "O'Higgins", lat: -34.4103, lng: -70.8600 },
  { nombre: 'Machalí', region: "O'Higgins", lat: -34.1833, lng: -70.6500 },
  { nombre: 'Graneros', region: "O'Higgins", lat: -34.0667, lng: -70.7333 },
  { nombre: 'Santa Cruz', region: "O'Higgins", lat: -34.6392, lng: -71.3669 },
  { nombre: 'Pichilemu', region: "O'Higgins", lat: -34.3869, lng: -72.0036 },

  // Región del Maule
  { nombre: 'Talca', region: 'Maule', lat: -35.4264, lng: -71.6554 },
  { nombre: 'Curicó', region: 'Maule', lat: -34.9830, lng: -71.2394 },
  { nombre: 'Linares', region: 'Maule', lat: -35.8500, lng: -71.5833 },
  { nombre: 'Cauquenes', region: 'Maule', lat: -35.9667, lng: -72.3167 },
  { nombre: 'Constitución', region: 'Maule', lat: -35.3333, lng: -72.4167 },
  { nombre: 'Parral', region: 'Maule', lat: -36.1431, lng: -71.8258 },
  { nombre: 'Molina', region: 'Maule', lat: -35.1142, lng: -71.2786 },

  // Región de Ñuble
  { nombre: 'Chillán', region: 'Ñuble', lat: -36.6066, lng: -72.1034 },
  { nombre: 'Chillán Viejo', region: 'Ñuble', lat: -36.6225, lng: -72.1344 },
  { nombre: 'San Carlos', region: 'Ñuble', lat: -36.4250, lng: -71.9583 },
  { nombre: 'Bulnes', region: 'Ñuble', lat: -36.7431, lng: -72.2981 },
  { nombre: 'Quirihue', region: 'Ñuble', lat: -36.2789, lng: -72.5422 },

  // Región del Biobío
  { nombre: 'Concepción', region: 'Biobío', lat: -36.8201, lng: -73.0444 },
  { nombre: 'Talcahuano', region: 'Biobío', lat: -36.7167, lng: -73.1167 },
  { nombre: 'Los Ángeles', region: 'Biobío', lat: -37.4689, lng: -72.3527 },
  { nombre: 'Chiguayante', region: 'Biobío', lat: -36.9264, lng: -73.0292 },
  { nombre: 'San Pedro de la Paz', region: 'Biobío', lat: -36.8383, lng: -73.0972 },
  { nombre: 'Coronel', region: 'Biobío', lat: -37.0206, lng: -73.1503 },
  { nombre: 'Lota', region: 'Biobío', lat: -37.0897, lng: -73.1553 },
  { nombre: 'Tomé', region: 'Biobío', lat: -36.6167, lng: -72.9667 },
  { nombre: 'Penco', region: 'Biobío', lat: -36.7400, lng: -72.9972 },
  { nombre: 'Lebu', region: 'Biobío', lat: -37.6069, lng: -73.6511 },
  { nombre: 'Arauco', region: 'Biobío', lat: -37.2464, lng: -73.3178 },
  { nombre: 'Cabrero', region: 'Biobío', lat: -37.0333, lng: -72.4000 },

  // Región de La Araucanía
  { nombre: 'Temuco', region: 'Araucanía', lat: -38.7359, lng: -72.5904 },
  { nombre: 'Angol', region: 'Araucanía', lat: -37.7953, lng: -72.7114 },
  { nombre: 'Victoria', region: 'Araucanía', lat: -38.2333, lng: -72.3333 },
  { nombre: 'Villarrica', region: 'Araucanía', lat: -39.2806, lng: -72.2306 },
  { nombre: 'Lautaro', region: 'Araucanía', lat: -38.5319, lng: -72.4358 },
  { nombre: 'Pucón', region: 'Araucanía', lat: -39.2819, lng: -71.9544 },
  { nombre: 'Padre Las Casas', region: 'Araucanía', lat: -38.7631, lng: -72.5914 },

  // Región de Los Ríos
  { nombre: 'Valdivia', region: 'Los Ríos', lat: -39.8142, lng: -73.2459 },
  { nombre: 'La Unión', region: 'Los Ríos', lat: -40.2928, lng: -73.0831 },
  { nombre: 'Río Bueno', region: 'Los Ríos', lat: -40.3347, lng: -72.9558 },
  { nombre: 'Panguipulli', region: 'Los Ríos', lat: -39.6428, lng: -72.3311 },

  // Región de Los Lagos
  { nombre: 'Puerto Montt', region: 'Los Lagos', lat: -41.4693, lng: -72.9424 },
  { nombre: 'Osorno', region: 'Los Lagos', lat: -40.5736, lng: -73.1322 },
  { nombre: 'Castro', region: 'Los Lagos', lat: -42.4792, lng: -73.7625 },
  { nombre: 'Puerto Varas', region: 'Los Lagos', lat: -41.3192, lng: -72.9836 },
  { nombre: 'Ancud', region: 'Los Lagos', lat: -41.8697, lng: -73.8250 },
  { nombre: 'Calbuco', region: 'Los Lagos', lat: -41.7733, lng: -73.1319 },
  { nombre: 'Purranque', region: 'Los Lagos', lat: -40.9139, lng: -73.1656 },

  // Región de Aysén
  { nombre: 'Coyhaique', region: 'Aysén', lat: -45.5752, lng: -72.0662 },
  { nombre: 'Puerto Aysén', region: 'Aysén', lat: -45.4031, lng: -72.6933 },
  { nombre: 'Chile Chico', region: 'Aysén', lat: -46.5406, lng: -71.7222 },
  { nombre: 'Cochrane', region: 'Aysén', lat: -47.2544, lng: -72.5733 },

  // Región de Magallanes
  { nombre: 'Punta Arenas', region: 'Magallanes', lat: -53.1638, lng: -70.9171 },
  { nombre: 'Puerto Natales', region: 'Magallanes', lat: -51.7308, lng: -72.5050 },
  { nombre: 'Porvenir', region: 'Magallanes', lat: -53.2981, lng: -70.3686 },
  { nombre: 'Puerto Williams', region: 'Magallanes', lat: -54.9333, lng: -67.6167 },
];

/**
 * Buscar comuna por nombre (case-insensitive)
 */
export function findComuna(nombre: string): Comuna | undefined {
  return comunasChile.find(
    (c) => c.nombre.toLowerCase() === nombre.toLowerCase()
  );
}

/**
 * Obtener todas las comunas de una región
 */
export function getComunasByRegion(region: string): Comuna[] {
  return comunasChile.filter((c) => c.region === region);
}

/**
 * Obtener todas las regiones únicas
 */
export function getRegiones(): string[] {
  return Array.from(new Set(comunasChile.map((c) => c.region))).sort();
}

/**
 * Total de comunas en el sistema
 */
export const TOTAL_COMUNAS = comunasChile.length;
