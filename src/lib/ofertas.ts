export type Oferta = {
  id: string;
  titulo: string;
  empresa: string;
  comuna: string;
  tipoJornada: 'Full-time' | 'Part-time' | 'Freelance' | 'Práctica';
  descripcion: string;
  tags: string[];
  salario?: string;
  publicadaHace: string;
  lat: number;
  lng: number;
};

export const ofertasDestacadas: Oferta[] = [
  {
    id: '1',
    titulo: 'Desarrollador/a Frontend Senior',
    empresa: 'Innovatec Labs',
    comuna: 'Santiago Centro',
    tipoJornada: 'Full-time',
    descripcion:
      'Lidera la evolución de nuestras experiencias web multiregión utilizando Astro, Tailwind y una arquitectura headless.',
    tags: ['Astro', 'Tailwind', 'UX'],
    salario: '$2.400.000 CLP',
    publicadaHace: 'Hace 2 días',
    lat: -33.4489,
    lng: -70.6693
  },
  {
    id: '2',
    titulo: 'Especialista en Datos Geoespaciales',
    empresa: 'GeoAnalytics Chile',
    comuna: 'Providencia',
    tipoJornada: 'Full-time',
    descripcion:
      'Diseña modelos de análisis territorial para proyectos de movilidad y empleo integrando capas geográficas en Supabase.',
    tags: ['PostGIS', 'Python', 'Análisis'],
    publicadaHace: 'Hace 5 días',
    lat: -33.4254,
    lng: -70.5665
  },
  {
    id: '3',
    titulo: 'Diseñador/a de Producto',
    empresa: 'Andes Talent',
    comuna: 'Ñuñoa',
    tipoJornada: 'Part-time',
    descripcion:
      'Co-crea experiencias digitales enfocadas en accesibilidad e inclusión laboral para nuestra comunidad.',
    tags: ['Figma', 'Design Systems', 'Research'],
    publicadaHace: 'Hace 1 semana',
    lat: -33.4569,
    lng: -70.5796
  },
  {
    id: '4',
    titulo: 'Project Manager TI',
    empresa: 'Latam Digital Services',
    comuna: 'Las Condes',
    tipoJornada: 'Full-time',
    descripcion:
      'Coordina equipos multidisciplinares para implementar soluciones cloud y procesos ágiles de reclutamiento.',
    tags: ['Agile', 'Cloud', 'Stakeholders'],
    publicadaHace: 'Hace 3 días',
    lat: -33.4148,
    lng: -70.5986
  }
];
