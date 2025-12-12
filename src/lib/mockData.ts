export type Oferta = {
  id: string;
  titulo: string;
  descripcion: string;
  empresa: string;
  tipo_jornada: 'Full-time' | 'Part-time' | 'Freelance' | 'Práctica';
  categoria: string;
  comuna: string;
  lat: number;
  lng: number;
  salario?: string;
  experiencia?: string;
  tags?: string[];
};

export const ofertasDestacadas: Oferta[] = [
  {
    id: '1',
    titulo: 'Desarrollador Frontend Senior',
    descripcion: 'Lidera iniciativas web para una scale-up latinoamericana enfocada en productos B2C.',
    empresa: 'Andes Digital',
    tipo_jornada: 'Full-time',
    categoria: 'Tecnología',
    comuna: 'Santiago',
    lat: -33.4489,
    lng: -70.6693,
    salario: '$2.500.000 - $3.200.000 CLP',
    experiencia: '5+ años',
    tags: ['React', 'TypeScript', 'UX'],
  },
  {
    id: '2',
    titulo: 'Analista de Datos',
    descripcion: 'Automatiza dashboards para retail con foco en demanda y supply chain.',
    empresa: 'RetailNext',
    tipo_jornada: 'Full-time',
    categoria: 'Data',
    comuna: 'Providencia',
    lat: -33.4263,
    lng: -70.5729,
    salario: '$1.800.000 - $2.200.000 CLP',
    experiencia: '3+ años',
    tags: ['SQL', 'Python', 'PowerBI'],
  },
  {
    id: '3',
    titulo: 'Ejecutivo Comercial B2B',
    descripcion: 'Gestiona pipeline enterprise y coordina demos con decisores clave.',
    empresa: 'SaaS Factory',
    tipo_jornada: 'Full-time',
    categoria: 'Ventas',
    comuna: 'Las Condes',
    lat: -33.4097,
    lng: -70.5667,
    salario: '$1.500.000 + variable',
    experiencia: '4+ años',
    tags: ['CRM', 'Negociación', 'Enterprise'],
  },
  {
    id: '4',
    titulo: 'Diseñador UX/UI',
    descripcion: 'Rediseña onboarding mobile con research continuo y tests A/B.',
    empresa: 'NubePay',
    tipo_jornada: 'Freelance',
    categoria: 'Diseño',
    comuna: 'Ñuñoa',
    lat: -33.4569,
    lng: -70.5958,
    salario: 'Proyecto 3 meses',
    experiencia: '3+ años',
    tags: ['Figma', 'Research', 'Motion'],
  },
];

export const filtrosDisponibles = {
  jornadas: ['Full-time', 'Part-time', 'Freelance', 'Práctica'],
  categorias: ['Tecnología', 'Data', 'Ventas', 'Operaciones', 'Marketing', 'Diseño'],
  comunas: ['Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'Maipú', 'La Florida'],
};
