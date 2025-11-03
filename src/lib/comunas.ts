export interface Comuna {
  nombre: string;
  region: string;
  lat: number;
  lng: number;
}

export const comunasChile: Comuna[] = [
  // Región Metropolitana
  { nombre: 'Santiago', region: 'Metropolitana', lat: -33.4489, lng: -70.6693 },
  { nombre: 'Providencia', region: 'Metropolitana', lat: -33.4270, lng: -70.6109 },
  { nombre: 'Las Condes', region: 'Metropolitana', lat: -33.4127, lng: -70.5837 },
  { nombre: 'Vitacura', region: 'Metropolitana', lat: -33.3823, lng: -70.5716 },
  { nombre: 'La Reina', region: 'Metropolitana', lat: -33.4458, lng: -70.5393 },
  { nombre: 'Ñuñoa', region: 'Metropolitana', lat: -33.4569, lng: -70.5977 },
  { nombre: 'Macul', region: 'Metropolitana', lat: -33.4867, lng: -70.5972 },
  { nombre: 'Peñalolén', region: 'Metropolitana', lat: -33.4910, lng: -70.5464 },
  { nombre: 'La Florida', region: 'Metropolitana', lat: -33.5229, lng: -70.5990 },
  { nombre: 'Puente Alto', region: 'Metropolitana', lat: -33.6104, lng: -70.5756 },
  { nombre: 'San Miguel', region: 'Metropolitana', lat: -33.4967, lng: -70.6511 },
  { nombre: 'Maipú', region: 'Metropolitana', lat: -33.5110, lng: -70.7576 },
  { nombre: 'Estación Central', region: 'Metropolitana', lat: -33.4591, lng: -70.6828 },
  { nombre: 'Cerrillos', region: 'Metropolitana', lat: -33.4972, lng: -70.7083 },
  { nombre: 'Pudahuel', region: 'Metropolitana', lat: -33.4403, lng: -70.7640 },
  { nombre: 'Quilicura', region: 'Metropolitana', lat: -33.3606, lng: -70.7323 },
  { nombre: 'Renca', region: 'Metropolitana', lat: -33.4041, lng: -70.7207 },
  { nombre: 'Conchalí', region: 'Metropolitana', lat: -33.3874, lng: -70.6734 },
  { nombre: 'Huechuraba', region: 'Metropolitana', lat: -33.3695, lng: -70.6361 },
  { nombre: 'Recoleta', region: 'Metropolitana', lat: -33.4114, lng: -70.6374 },
  { nombre: 'Independencia', region: 'Metropolitana', lat: -33.4193, lng: -70.6641 },
  { nombre: 'La Cisterna', region: 'Metropolitana', lat: -33.5324, lng: -70.6613 },
  { nombre: 'San Joaquín', region: 'Metropolitana', lat: -33.4976, lng: -70.6286 },
  { nombre: 'Pedro Aguirre Cerda', region: 'Metropolitana', lat: -33.4906, lng: -70.6745 },
  { nombre: 'Lo Espejo', region: 'Metropolitana', lat: -33.5221, lng: -70.6883 },
  { nombre: 'San Ramón', region: 'Metropolitana', lat: -33.5363, lng: -70.6387 },
  { nombre: 'La Granja', region: 'Metropolitana', lat: -33.5382, lng: -70.6159 },
  { nombre: 'La Pintana', region: 'Metropolitana', lat: -33.5858, lng: -70.6344 },
  { nombre: 'San Bernardo', region: 'Metropolitana', lat: -33.5927, lng: -70.7006 },
  { nombre: 'Buin', region: 'Metropolitana', lat: -33.7308, lng: -70.7437 },
  { nombre: 'Paine', region: 'Metropolitana', lat: -33.8126, lng: -70.7414 },
  { nombre: 'Colina', region: 'Metropolitana', lat: -33.1983, lng: -70.6719 },
  { nombre: 'Lampa', region: 'Metropolitana', lat: -33.2879, lng: -70.8782 },
  { nombre: 'Til Til', region: 'Metropolitana', lat: -33.0900, lng: -70.9244 },
  { nombre: 'Pirque', region: 'Metropolitana', lat: -33.6641, lng: -70.5836 },
  { nombre: 'San José de Maipo', region: 'Metropolitana', lat: -33.6426, lng: -70.3518 },
  { nombre: 'Melipilla', region: 'Metropolitana', lat: -33.6887, lng: -71.2147 },
  { nombre: 'Talagante', region: 'Metropolitana', lat: -33.6648, lng: -70.9289 },
  { nombre: 'Peñaflor', region: 'Metropolitana', lat: -33.6096, lng: -70.8795 },
  { nombre: 'Isla de Maipo', region: 'Metropolitana', lat: -33.7546, lng: -70.9003 },

  // Región de Valparaíso
  { nombre: 'Valparaíso', region: 'Valparaíso', lat: -33.0472, lng: -71.6127 },
  { nombre: 'Viña del Mar', region: 'Valparaíso', lat: -33.0245, lng: -71.5518 },
  { nombre: 'Concón', region: 'Valparaíso', lat: -32.9253, lng: -71.5203 },
  { nombre: 'Quilpué', region: 'Valparaíso', lat: -33.0472, lng: -71.4419 },
  { nombre: 'Villa Alemana', region: 'Valparaíso', lat: -33.0444, lng: -71.3736 },
  { nombre: 'Casablanca', region: 'Valparaíso', lat: -33.3167, lng: -71.4167 },
  { nombre: 'Quillota', region: 'Valparaíso', lat: -32.8833, lng: -71.2500 },
  { nombre: 'La Calera', region: 'Valparaíso', lat: -32.7833, lng: -71.2000 },
  { nombre: 'Limache', region: 'Valparaíso', lat: -33.0167, lng: -71.2667 },
  { nombre: 'Olmué', region: 'Valparaíso', lat: -33.0167, lng: -71.2000 },
  { nombre: 'San Antonio', region: 'Valparaíso', lat: -33.5958, lng: -71.6127 },
  { nombre: 'Cartagena', region: 'Valparaíso', lat: -33.5548, lng: -71.6061 },
  { nombre: 'El Quisco', region: 'Valparaíso', lat: -33.3992, lng: -71.6951 },
  { nombre: 'Algarrobo', region: 'Valparaíso', lat: -33.3667, lng: -71.6667 },
  { nombre: 'San Felipe', region: 'Valparaíso', lat: -32.7500, lng: -70.7333 },
  { nombre: 'Los Andes', region: 'Valparaíso', lat: -32.8333, lng: -70.6000 },
  { nombre: 'Quillota', region: 'Valparaíso', lat: -32.8794, lng: -71.2486 },
  { nombre: 'La Ligua', region: 'Valparaíso', lat: -32.4500, lng: -71.2333 },

  // Región del Biobío
  { nombre: 'Concepción', region: 'Biobío', lat: -36.8201, lng: -73.0444 },
  { nombre: 'Talcahuano', region: 'Biobío', lat: -36.7242, lng: -73.1167 },
  { nombre: 'Hualpén', region: 'Biobío', lat: -36.7833, lng: -73.0833 },
  { nombre: 'Chiguayante', region: 'Biobío', lat: -36.9167, lng: -73.0167 },
  { nombre: 'San Pedro de la Paz', region: 'Biobío', lat: -36.8383, lng: -73.1117 },
  { nombre: 'Coronel', region: 'Biobío', lat: -37.0333, lng: -73.1500 },
  { nombre: 'Lota', region: 'Biobío', lat: -37.0917, lng: -73.1583 },
  { nombre: 'Tomé', region: 'Biobío', lat: -36.6167, lng: -72.9583 },
  { nombre: 'Penco', region: 'Biobío', lat: -36.7333, lng: -72.9833 },
  { nombre: 'Los Ángeles', region: 'Biobío', lat: -37.4689, lng: -72.3527 },
  { nombre: 'Lebu', region: 'Biobío', lat: -37.6167, lng: -73.6500 },
  { nombre: 'Arauco', region: 'Biobío', lat: -37.2500, lng: -73.3167 },
  { nombre: 'Cañete', region: 'Biobío', lat: -37.8000, lng: -73.4000 },

  // Región de La Araucanía
  { nombre: 'Temuco', region: 'Araucanía', lat: -38.7359, lng: -72.5904 },
  { nombre: 'Padre Las Casas', region: 'Araucanía', lat: -38.7667, lng: -72.6000 },
  { nombre: 'Villarrica', region: 'Araucanía', lat: -39.2833, lng: -72.2333 },
  { nombre: 'Pucón', region: 'Araucanía', lat: -39.2833, lng: -71.9667 },
  { nombre: 'Angol', region: 'Araucanía', lat: -37.8000, lng: -72.7167 },
  { nombre: 'Victoria', region: 'Araucanía', lat: -38.2333, lng: -72.3333 },
  { nombre: 'Lautaro', region: 'Araucanía', lat: -38.5333, lng: -72.4333 },
  { nombre: 'Nueva Imperial', region: 'Araucanía', lat: -38.7500, lng: -72.9500 },

  // Región de Coquimbo
  { nombre: 'La Serena', region: 'Coquimbo', lat: -29.9027, lng: -71.2519 },
  { nombre: 'Coquimbo', region: 'Coquimbo', lat: -29.9533, lng: -71.3436 },
  { nombre: 'Ovalle', region: 'Coquimbo', lat: -30.6000, lng: -71.2000 },
  { nombre: 'Vicuña', region: 'Coquimbo', lat: -30.0333, lng: -70.7167 },
  { nombre: 'Illapel', region: 'Coquimbo', lat: -31.6333, lng: -71.1667 },
  { nombre: 'Andacollo', region: 'Coquimbo', lat: -30.2333, lng: -71.0833 },
  { nombre: 'Monte Patria', region: 'Coquimbo', lat: -30.7000, lng: -70.9500 },

  // Región de Antofagasta
  { nombre: 'Antofagasta', region: 'Antofagasta', lat: -23.6509, lng: -70.3975 },
  { nombre: 'Calama', region: 'Antofagasta', lat: -22.4667, lng: -68.9333 },
  { nombre: 'Tocopilla', region: 'Antofagasta', lat: -22.0917, lng: -70.1972 },
  { nombre: 'Mejillones', region: 'Antofagasta', lat: -23.1000, lng: -70.4500 },
  { nombre: 'Taltal', region: 'Antofagasta', lat: -25.4000, lng: -70.4833 },
  { nombre: 'San Pedro de Atacama', region: 'Antofagasta', lat: -22.9167, lng: -68.2000 },

  // Región de Atacama
  { nombre: 'Copiapó', region: 'Atacama', lat: -27.3668, lng: -70.3323 },
  { nombre: 'Vallenar', region: 'Atacama', lat: -28.5667, lng: -70.7667 },
  { nombre: 'Caldera', region: 'Atacama', lat: -27.0667, lng: -70.8333 },
  { nombre: 'Chañaral', region: 'Atacama', lat: -26.3333, lng: -70.6167 },
  { nombre: 'Diego de Almagro', region: 'Atacama', lat: -26.3833, lng: -70.0500 },

  // Región del Maule
  { nombre: 'Talca', region: 'Maule', lat: -35.4264, lng: -71.6554 },
  { nombre: 'Curicó', region: 'Maule', lat: -34.9830, lng: -71.2394 },
  { nombre: 'Linares', region: 'Maule', lat: -35.8500, lng: -71.6000 },
  { nombre: 'Cauquenes', region: 'Maule', lat: -35.9667, lng: -72.3167 },
  { nombre: 'Constitución', region: 'Maule', lat: -35.3333, lng: -72.4167 },
  { nombre: 'Parral', region: 'Maule', lat: -36.1500, lng: -71.8167 },
  { nombre: 'Molina', region: 'Maule', lat: -35.1167, lng: -71.2833 },
  { nombre: 'San Javier', region: 'Maule', lat: -35.5833, lng: -71.7333 },

  // Región de Ñuble
  { nombre: 'Chillán', region: 'Ñuble', lat: -36.6066, lng: -72.1034 },
  { nombre: 'Chillán Viejo', region: 'Ñuble', lat: -36.6200, lng: -72.1300 },
  { nombre: 'San Carlos', region: 'Ñuble', lat: -36.4167, lng: -71.9583 },
  { nombre: 'Bulnes', region: 'Ñuble', lat: -36.7417, lng: -72.2969 },
  { nombre: 'Quirihue', region: 'Ñuble', lat: -36.2833, lng: -72.5333 },
  { nombre: 'Yungay', region: 'Ñuble', lat: -37.1167, lng: -72.0167 },

  // Región de O'Higgins
  { nombre: 'Rancagua', region: "O'Higgins", lat: -34.1708, lng: -70.7407 },
  { nombre: 'Machalí', region: "O'Higgins", lat: -34.1833, lng: -70.6500 },
  { nombre: 'Graneros', region: "O'Higgins", lat: -34.0667, lng: -70.7333 },
  { nombre: 'San Fernando', region: "O'Higgins", lat: -34.5833, lng: -70.9833 },
  { nombre: 'Santa Cruz', region: "O'Higgins", lat: -34.6333, lng: -71.3667 },
  { nombre: 'Rengo', region: "O'Higgins", lat: -34.4000, lng: -70.8500 },
  { nombre: 'Pichilemu', region: "O'Higgins", lat: -34.3833, lng: -72.0000 },
  { nombre: 'San Vicente', region: "O'Higgins", lat: -34.4333, lng: -71.0833 },

  // Región de Los Lagos
  { nombre: 'Puerto Montt', region: 'Los Lagos', lat: -41.4693, lng: -72.9424 },
  { nombre: 'Puerto Varas', region: 'Los Lagos', lat: -41.3167, lng: -72.9833 },
  { nombre: 'Osorno', region: 'Los Lagos', lat: -40.5736, lng: -73.1322 },
  { nombre: 'Castro', region: 'Los Lagos', lat: -42.4833, lng: -73.7667 },
  { nombre: 'Ancud', region: 'Los Lagos', lat: -41.8667, lng: -73.8167 },
  { nombre: 'Quellón', region: 'Los Lagos', lat: -43.1167, lng: -73.6167 },
  { nombre: 'Chonchi', region: 'Los Lagos', lat: -42.6167, lng: -73.7667 },

  // Región de Los Ríos
  { nombre: 'Valdivia', region: 'Los Ríos', lat: -39.8142, lng: -73.2459 },
  { nombre: 'La Unión', region: 'Los Ríos', lat: -40.3000, lng: -73.0833 },
  { nombre: 'Río Bueno', region: 'Los Ríos', lat: -40.3333, lng: -72.9500 },
  { nombre: 'Panguipulli', region: 'Los Ríos', lat: -39.6333, lng: -72.3333 },

  // Región de Arica y Parinacota
  { nombre: 'Arica', region: 'Arica y Parinacota', lat: -18.4746, lng: -70.2979 },
  { nombre: 'Putre', region: 'Arica y Parinacota', lat: -18.1833, lng: -69.5500 },

  // Región de Tarapacá
  { nombre: 'Iquique', region: 'Tarapacá', lat: -20.2307, lng: -70.1435 },
  { nombre: 'Alto Hospicio', region: 'Tarapacá', lat: -20.2667, lng: -70.1000 },
  { nombre: 'Pozo Almonte', region: 'Tarapacá', lat: -20.2500, lng: -69.7833 },

  // Región de Aysén
  { nombre: 'Coyhaique', region: 'Aysén', lat: -45.5752, lng: -72.0662 },
  { nombre: 'Puerto Aysén', region: 'Aysén', lat: -45.4000, lng: -72.7000 },
  { nombre: 'Chile Chico', region: 'Aysén', lat: -46.5417, lng: -71.7194 },

  // Región de Magallanes
  { nombre: 'Punta Arenas', region: 'Magallanes', lat: -53.1638, lng: -70.9171 },
  { nombre: 'Puerto Natales', region: 'Magallanes', lat: -51.7333, lng: -72.5167 },
  { nombre: 'Porvenir', region: 'Magallanes', lat: -53.3000, lng: -70.3667 },
];

export const getComunaByName = (nombre: string): Comuna | undefined => {
  return comunasChile.find(
    (comuna) => comuna.nombre.toLowerCase() === nombre.toLowerCase()
  );
};

export const getComunasByRegion = (region: string): Comuna[] => {
  return comunasChile.filter((comuna) => comuna.region === region);
};

export const getRegiones = (): string[] => {
  return Array.from(new Set(comunasChile.map((comuna) => comuna.region)));
};
