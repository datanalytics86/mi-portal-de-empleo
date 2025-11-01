/**
 * Mock data - Ofertas de trabajo simuladas
 *
 * Datos de ejemplo realistas para desarrollo y testing
 * En producción, estos datos vendrán de Supabase
 */

export interface MockOferta {
  id: string;
  titulo: string;
  empresa: string;
  descripcion: string;
  comuna: string;
  region: string;
  tipo_jornada: 'Full-time' | 'Part-time' | 'Freelance' | 'Práctica';
  categoria: string;
  salario_min?: number;
  salario_max?: number;
  activa: boolean;
  created_at: string;
  expires_at: string;
  postulaciones_count: number;
}

/**
 * Genera ofertas de trabajo simuladas
 */
export const mockOfertas: MockOferta[] = [
  // Región Metropolitana
  {
    id: '1',
    titulo: 'Desarrollador Full Stack',
    empresa: 'TechCorp Chile',
    descripcion: 'Buscamos desarrollador con experiencia en React, Node.js y PostgreSQL. Trabajarás en proyectos innovadores para clientes internacionales. Ofrecemos ambiente colaborativo, crecimiento profesional y beneficios competitivos.',
    comuna: 'Santiago',
    region: 'Metropolitana',
    tipo_jornada: 'Full-time',
    categoria: 'Tecnología',
    salario_min: 1500000,
    salario_max: 2500000,
    activa: true,
    created_at: '2025-10-25T10:00:00Z',
    expires_at: '2025-11-25T10:00:00Z',
    postulaciones_count: 15
  },
  {
    id: '2',
    titulo: 'Diseñador UX/UI',
    empresa: 'Digital Studio',
    descripcion: 'Estamos en busca de diseñador creativo con pasión por la experiencia de usuario. Dominio de Figma, Adobe XD. Portfolio requerido. Trabajo híbrido disponible.',
    comuna: 'Providencia',
    region: 'Metropolitana',
    tipo_jornada: 'Full-time',
    categoria: 'Diseño',
    salario_min: 1200000,
    salario_max: 1800000,
    activa: true,
    created_at: '2025-10-26T14:30:00Z',
    expires_at: '2025-11-26T14:30:00Z',
    postulaciones_count: 23
  },
  {
    id: '3',
    titulo: 'Contador Senior',
    empresa: 'Consultora Financiera SpA',
    descripcion: 'Buscamos contador con experiencia en auditoría y normativa tributaria chilena. Manejo de ERP. Excelente oportunidad de desarrollo en empresa consolidada.',
    comuna: 'Las Condes',
    region: 'Metropolitana',
    tipo_jornada: 'Full-time',
    categoria: 'Finanzas',
    salario_min: 1400000,
    salario_max: 2000000,
    activa: true,
    created_at: '2025-10-24T09:00:00Z',
    expires_at: '2025-11-24T09:00:00Z',
    postulaciones_count: 8
  },
  {
    id: '4',
    titulo: 'Practicante de Marketing Digital',
    empresa: 'Agencia Creativa',
    descripcion: 'Buscamos estudiante de último año para práctica profesional. Apoyo en redes sociales, creación de contenido y análisis de métricas. Posibilidad de contratación.',
    comuna: 'Ñuñoa',
    region: 'Metropolitana',
    tipo_jornada: 'Práctica',
    categoria: 'Marketing',
    salario_min: 300000,
    salario_max: 400000,
    activa: true,
    created_at: '2025-10-27T11:00:00Z',
    expires_at: '2025-11-27T11:00:00Z',
    postulaciones_count: 31
  },

  // Valparaíso
  {
    id: '5',
    titulo: 'Ingeniero de Soporte TI',
    empresa: 'Servicios Tecnológicos Valpo',
    descripcion: 'Soporte técnico nivel 2, mantención de servidores, atención a usuarios. Conocimientos en redes y sistemas Windows/Linux. Presencial en Valparaíso.',
    comuna: 'Valparaíso',
    region: 'Valparaíso',
    tipo_jornada: 'Full-time',
    categoria: 'Tecnología',
    salario_min: 900000,
    salario_max: 1300000,
    activa: true,
    created_at: '2025-10-26T08:00:00Z',
    expires_at: '2025-11-26T08:00:00Z',
    postulaciones_count: 12
  },
  {
    id: '6',
    titulo: 'Chef de Cocina',
    empresa: 'Restaurant Cerro Alegre',
    descripcion: 'Buscamos chef con experiencia en cocina chilena e internacional. Creatividad, liderazgo de equipo. Restaurant con vista al mar en zona patrimonial.',
    comuna: 'Valparaíso',
    region: 'Valparaíso',
    tipo_jornada: 'Full-time',
    categoria: 'Gastronomía',
    salario_min: 800000,
    salario_max: 1200000,
    activa: true,
    created_at: '2025-10-23T15:00:00Z',
    expires_at: '2025-11-23T15:00:00Z',
    postulaciones_count: 19
  },
  {
    id: '7',
    titulo: 'Vendedor Part-time',
    empresa: 'Retail Viña del Mar',
    descripcion: 'Buscamos vendedor para tienda de retail. Turnos flexibles, fines de semana. Experiencia en atención a clientes. Comisiones atractivas.',
    comuna: 'Viña del Mar',
    region: 'Valparaíso',
    tipo_jornada: 'Part-time',
    categoria: 'Ventas',
    salario_min: 400000,
    salario_max: 600000,
    activa: true,
    created_at: '2025-10-28T10:00:00Z',
    expires_at: '2025-11-28T10:00:00Z',
    postulaciones_count: 27
  },

  // Concepción
  {
    id: '8',
    titulo: 'Ingeniero Civil Industrial',
    empresa: 'Constructora del Bío Bío',
    descripcion: 'Supervisión de obras, control de presupuestos y coordinación de equipos. Proyectos de infraestructura regional. Experiencia mínima 3 años.',
    comuna: 'Concepción',
    region: 'Biobío',
    tipo_jornada: 'Full-time',
    categoria: 'Construcción',
    salario_min: 1600000,
    salario_max: 2200000,
    activa: true,
    created_at: '2025-10-25T12:00:00Z',
    expires_at: '2025-11-25T12:00:00Z',
    postulaciones_count: 9
  },
  {
    id: '9',
    titulo: 'Profesor de Inglés',
    empresa: 'Instituto de Idiomas Concepción',
    descripcion: 'Clases a adultos y empresas. Horarios tarde/noche. Se requiere certificación internacional (TOEFL/Cambridge). Ambiente grato y profesional.',
    comuna: 'Concepción',
    region: 'Biobío',
    tipo_jornada: 'Part-time',
    categoria: 'Educación',
    salario_min: 600000,
    salario_max: 900000,
    activa: true,
    created_at: '2025-10-27T09:00:00Z',
    expires_at: '2025-11-27T09:00:00Z',
    postulaciones_count: 14
  },

  // La Serena
  {
    id: '10',
    titulo: 'Administrador de Hotel',
    empresa: 'Hotel Costa Coquimbo',
    descripcion: 'Gestión integral de operaciones hoteleras. Experiencia en turismo, manejo de personal, atención a huéspedes. Temporada alta con posibilidad de contrato indefinido.',
    comuna: 'La Serena',
    region: 'Coquimbo',
    tipo_jornada: 'Full-time',
    categoria: 'Turismo',
    salario_min: 1000000,
    salario_max: 1500000,
    activa: true,
    created_at: '2025-10-24T14:00:00Z',
    expires_at: '2025-11-24T14:00:00Z',
    postulaciones_count: 11
  },

  // Temuco
  {
    id: '11',
    titulo: 'Analista de Datos',
    empresa: 'Consultoría Regional',
    descripcion: 'Análisis de datos con Python, SQL y Power BI. Generación de reportes e insights para toma de decisiones. Modalidad remota con reuniones presenciales mensuales.',
    comuna: 'Temuco',
    region: 'Araucanía',
    tipo_jornada: 'Full-time',
    categoria: 'Tecnología',
    salario_min: 1100000,
    salario_max: 1600000,
    activa: true,
    created_at: '2025-10-26T16:00:00Z',
    expires_at: '2025-11-26T16:00:00Z',
    postulaciones_count: 7
  },
  {
    id: '12',
    titulo: 'Asistente Administrativo',
    empresa: 'Clínica Araucanía',
    descripcion: 'Apoyo administrativo en centro médico. Manejo de agenda, atención telefónica, gestión de documentos. Deseable experiencia en salud.',
    comuna: 'Temuco',
    region: 'Araucanía',
    tipo_jornada: 'Full-time',
    categoria: 'Administración',
    salario_min: 550000,
    salario_max: 750000,
    activa: true,
    created_at: '2025-10-28T08:00:00Z',
    expires_at: '2025-11-28T08:00:00Z',
    postulaciones_count: 22
  },

  // Puerto Montt
  {
    id: '13',
    titulo: 'Supervisor de Logística',
    empresa: 'Exportadora Salmones del Sur',
    descripcion: 'Coordinación de cadena logística, control de inventarios, gestión de proveedores. Experiencia en industria salmonera valorada. Turnos rotativos.',
    comuna: 'Puerto Montt',
    region: 'Los Lagos',
    tipo_jornada: 'Full-time',
    categoria: 'Logística',
    salario_min: 1200000,
    salario_max: 1700000,
    activa: true,
    created_at: '2025-10-25T13:00:00Z',
    expires_at: '2025-11-25T13:00:00Z',
    postulaciones_count: 16
  },

  // Antofagasta
  {
    id: '14',
    titulo: 'Ingeniero de Minas',
    empresa: 'Minera Norte Grande',
    descripcion: 'Planificación minera, optimización de procesos. Sistema de turnos 7x7. Excelentes beneficios y oportunidad de desarrollo en gran minería.',
    comuna: 'Antofagasta',
    region: 'Antofagasta',
    tipo_jornada: 'Full-time',
    categoria: 'Minería',
    salario_min: 2500000,
    salario_max: 3500000,
    activa: true,
    created_at: '2025-10-23T11:00:00Z',
    expires_at: '2025-11-23T11:00:00Z',
    postulaciones_count: 5
  },

  // Iquique
  {
    id: '15',
    titulo: 'Community Manager Freelance',
    empresa: 'Agencia Digital Tarapacá',
    descripcion: 'Gestión de redes sociales para múltiples clientes. Creación de contenido, diseño básico, análisis de métricas. Trabajo 100% remoto, proyectos por mes.',
    comuna: 'Iquique',
    region: 'Tarapacá',
    tipo_jornada: 'Freelance',
    categoria: 'Marketing',
    salario_min: 400000,
    salario_max: 800000,
    activa: true,
    created_at: '2025-10-27T13:00:00Z',
    expires_at: '2025-11-27T13:00:00Z',
    postulaciones_count: 18
  },

  // Ofertas inactivas (para testing)
  {
    id: '16',
    titulo: 'Gerente de Proyectos (Finalizada)',
    empresa: 'Empresa XYZ',
    descripcion: 'Esta oferta ya expiró.',
    comuna: 'Santiago',
    region: 'Metropolitana',
    tipo_jornada: 'Full-time',
    categoria: 'Gestión',
    activa: false,
    created_at: '2025-09-01T10:00:00Z',
    expires_at: '2025-10-01T10:00:00Z',
    postulaciones_count: 42
  }
];

/**
 * Filtrar ofertas activas
 */
export function getOfertasActivas(): MockOferta[] {
  return mockOfertas.filter(o => o.activa);
}

/**
 * Buscar oferta por ID
 */
export function findOfertaById(id: string): MockOferta | undefined {
  return mockOfertas.find(o => o.id === id);
}

/**
 * Filtrar ofertas por criterios
 */
export function filterOfertas(
  ofertas: MockOferta[],
  filters: {
    search?: string;
    tipoJornada?: string[];
    categoria?: string;
    comuna?: string;
  }
): MockOferta[] {
  let filtered = [...ofertas];

  // Búsqueda por texto
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(o =>
      o.titulo.toLowerCase().includes(searchLower) ||
      o.empresa.toLowerCase().includes(searchLower) ||
      o.descripcion.toLowerCase().includes(searchLower)
    );
  }

  // Filtro por tipo de jornada (multi-select)
  if (filters.tipoJornada && filters.tipoJornada.length > 0) {
    filtered = filtered.filter(o =>
      filters.tipoJornada!.includes(o.tipo_jornada)
    );
  }

  // Filtro por categoría
  if (filters.categoria) {
    filtered = filtered.filter(o => o.categoria === filters.categoria);
  }

  // Filtro por comuna
  if (filters.comuna) {
    filtered = filtered.filter(o => o.comuna === filters.comuna);
  }

  return filtered;
}

/**
 * Obtener categorías únicas
 */
export function getCategorias(): string[] {
  const categorias = new Set(mockOfertas.map(o => o.categoria));
  return Array.from(categorias).sort();
}

/**
 * Paginación de resultados
 */
export function paginateOfertas(
  ofertas: MockOferta[],
  page: number = 1,
  perPage: number = 10
): {
  data: MockOferta[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
} {
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    data: ofertas.slice(start, end),
    total: ofertas.length,
    page,
    perPage,
    totalPages: Math.ceil(ofertas.length / perPage)
  };
}
