// Principales comunas de Chile con coordenadas GPS
export interface Comuna {
  nombre: string;
  region: string;
  lat: number;
  lng: number;
}

export const COMUNAS: Comuna[] = [
  // Región Metropolitana
  { nombre: 'Santiago', region: 'Metropolitana', lat: -33.4569, lng: -70.6483 },
  { nombre: 'Providencia', region: 'Metropolitana', lat: -33.4328, lng: -70.6099 },
  { nombre: 'Las Condes', region: 'Metropolitana', lat: -33.4100, lng: -70.5706 },
  { nombre: 'Ñuñoa', region: 'Metropolitana', lat: -33.4569, lng: -70.5986 },
  { nombre: 'Maipú', region: 'Metropolitana', lat: -33.5103, lng: -70.7580 },
  { nombre: 'Puente Alto', region: 'Metropolitana', lat: -33.6116, lng: -70.5758 },
  { nombre: 'La Florida', region: 'Metropolitana', lat: -33.5233, lng: -70.5878 },
  { nombre: 'San Bernardo', region: 'Metropolitana', lat: -33.5921, lng: -70.6986 },
  { nombre: 'Quilicura', region: 'Metropolitana', lat: -33.3614, lng: -70.7327 },
  { nombre: 'El Bosque', region: 'Metropolitana', lat: -33.5685, lng: -70.6706 },
  { nombre: 'Pudahuel', region: 'Metropolitana', lat: -33.4339, lng: -70.7617 },
  { nombre: 'Peñalolén', region: 'Metropolitana', lat: -33.4882, lng: -70.5327 },
  { nombre: 'La Pintana', region: 'Metropolitana', lat: -33.5802, lng: -70.6286 },
  { nombre: 'Recoleta', region: 'Metropolitana', lat: -33.4103, lng: -70.6386 },
  { nombre: 'Macul', region: 'Metropolitana', lat: -33.4861, lng: -70.5991 },
  { nombre: 'Estación Central', region: 'Metropolitana', lat: -33.4697, lng: -70.6800 },
  { nombre: 'Cerrillos', region: 'Metropolitana', lat: -33.4888, lng: -70.7178 },
  { nombre: 'Conchalí', region: 'Metropolitana', lat: -33.3872, lng: -70.6639 },
  { nombre: 'Huechuraba', region: 'Metropolitana', lat: -33.3702, lng: -70.6436 },
  { nombre: 'Independencia', region: 'Metropolitana', lat: -33.4219, lng: -70.6533 },
  { nombre: 'La Cisterna', region: 'Metropolitana', lat: -33.5263, lng: -70.6578 },
  { nombre: 'La Granja', region: 'Metropolitana', lat: -33.5381, lng: -70.6292 },
  { nombre: 'La Reina', region: 'Metropolitana', lat: -33.4497, lng: -70.5408 },
  { nombre: 'Lo Barnechea', region: 'Metropolitana', lat: -33.3519, lng: -70.5197 },
  { nombre: 'Lo Espejo', region: 'Metropolitana', lat: -33.5131, lng: -70.6900 },
  { nombre: 'Lo Prado', region: 'Metropolitana', lat: -33.4533, lng: -70.7200 },
  { nombre: 'Padre Hurtado', region: 'Metropolitana', lat: -33.5614, lng: -70.8289 },
  { nombre: 'Pedro Aguirre Cerda', region: 'Metropolitana', lat: -33.4972, lng: -70.6700 },
  { nombre: 'Peñaflor', region: 'Metropolitana', lat: -33.5997, lng: -70.8836 },
  { nombre: 'Pirque', region: 'Metropolitana', lat: -33.6397, lng: -70.5597 },
  { nombre: 'Quinta Normal', region: 'Metropolitana', lat: -33.4436, lng: -70.7003 },
  { nombre: 'Renca', region: 'Metropolitana', lat: -33.3964, lng: -70.7197 },
  { nombre: 'San Joaquín', region: 'Metropolitana', lat: -33.4997, lng: -70.6425 },
  { nombre: 'San Miguel', region: 'Metropolitana', lat: -33.4972, lng: -70.6514 },
  { nombre: 'San Ramón', region: 'Metropolitana', lat: -33.5422, lng: -70.6400 },
  { nombre: 'Vitacura', region: 'Metropolitana', lat: -33.3956, lng: -70.5731 },
  // Valparaíso
  { nombre: 'Valparaíso', region: 'Valparaíso', lat: -33.0458, lng: -71.6197 },
  { nombre: 'Viña del Mar', region: 'Valparaíso', lat: -33.0245, lng: -71.5518 },
  { nombre: 'Quilpué', region: 'Valparaíso', lat: -33.0503, lng: -71.4408 },
  { nombre: 'Villa Alemana', region: 'Valparaíso', lat: -33.0431, lng: -71.3736 },
  { nombre: 'San Antonio', region: 'Valparaíso', lat: -33.5928, lng: -71.6211 },
  { nombre: 'Quillota', region: 'Valparaíso', lat: -32.8783, lng: -71.2472 },
  { nombre: 'Los Andes', region: 'Valparaíso', lat: -32.8350, lng: -70.5978 },
  // Biobío
  { nombre: 'Concepción', region: 'Biobío', lat: -36.8270, lng: -73.0503 },
  { nombre: 'Talcahuano', region: 'Biobío', lat: -36.7236, lng: -73.1139 },
  { nombre: 'Chillán', region: 'Biobío', lat: -36.6066, lng: -72.1034 },
  { nombre: 'Los Ángeles', region: 'Biobío', lat: -37.4700, lng: -72.3533 },
  { nombre: 'Coronel', region: 'Biobío', lat: -37.0253, lng: -73.1572 },
  // Araucanía
  { nombre: 'Temuco', region: 'Araucanía', lat: -38.7359, lng: -72.5904 },
  { nombre: 'Padre Las Casas', region: 'Araucanía', lat: -38.7700, lng: -72.6011 },
  { nombre: 'Villarrica', region: 'Araucanía', lat: -39.2817, lng: -72.2286 },
  // Los Lagos
  { nombre: 'Puerto Montt', region: 'Los Lagos', lat: -41.4717, lng: -72.9367 },
  { nombre: 'Puerto Varas', region: 'Los Lagos', lat: -41.3194, lng: -72.9822 },
  { nombre: 'Osorno', region: 'Los Lagos', lat: -40.5744, lng: -73.1328 },
  // Antofagasta
  { nombre: 'Antofagasta', region: 'Antofagasta', lat: -23.6509, lng: -70.3975 },
  { nombre: 'Calama', region: 'Antofagasta', lat: -22.4564, lng: -68.9183 },
  // Tarapacá
  { nombre: 'Iquique', region: 'Tarapacá', lat: -20.2208, lng: -70.1431 },
  { nombre: 'Alto Hospicio', region: 'Tarapacá', lat: -20.2728, lng: -70.1017 },
  // Arica y Parinacota
  { nombre: 'Arica', region: 'Arica y Parinacota', lat: -18.4783, lng: -70.3126 },
  // Coquimbo
  { nombre: 'La Serena', region: 'Coquimbo', lat: -29.9027, lng: -71.2519 },
  { nombre: 'Coquimbo', region: 'Coquimbo', lat: -29.9581, lng: -71.3386 },
  { nombre: 'Ovalle', region: 'Coquimbo', lat: -30.6033, lng: -71.2033 },
  // Atacama
  { nombre: 'Copiapó', region: 'Atacama', lat: -27.3667, lng: -70.3319 },
  // O\'Higgins
  { nombre: 'Rancagua', region: "O'Higgins", lat: -34.1703, lng: -70.7397 },
  { nombre: 'San Fernando', region: "O'Higgins", lat: -34.5856, lng: -70.9892 },
  // Maule
  { nombre: 'Talca', region: 'Maule', lat: -35.4264, lng: -71.6554 },
  { nombre: 'Curicó', region: 'Maule', lat: -34.9819, lng: -71.2381 },
  { nombre: 'Linares', region: 'Maule', lat: -35.8461, lng: -71.5961 },
  // Los Ríos
  { nombre: 'Valdivia', region: 'Los Ríos', lat: -39.8142, lng: -73.2459 },
  // Aysén
  { nombre: 'Coyhaique', region: 'Aysén', lat: -45.5712, lng: -72.0669 },
  // Magallanes
  { nombre: 'Punta Arenas', region: 'Magallanes', lat: -53.1638, lng: -70.9171 },
];

export function getComunaCoords(nombre: string): { lat: number; lng: number } | null {
  const comuna = COMUNAS.find(
    (c) => c.nombre.toLowerCase() === nombre.toLowerCase()
  );
  return comuna ? { lat: comuna.lat, lng: comuna.lng } : null;
}

export const COMUNAS_NOMBRES = COMUNAS.map((c) => c.nombre).sort();
