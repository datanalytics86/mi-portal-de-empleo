import type { TipoEmpleo } from '../types/database';

export const DEMO_EMPLEADOR_ID = 'eeeeeeee-0000-4000-8000-000000000000';
export const DEMO_EMPLEADOR_EMAIL = 'demo-ofertas@portal.cl';
export const DEMO_EMPLEADOR_EMPRESA = 'Portal Demo Chile';
export const DEMO_TOTAL = 1100;

const COMUNAS: Array<[string, number, number]> = [
  ['Santiago', -33.4569, -70.6483],
  ['Providencia', -33.4328, -70.6099],
  ['Las Condes', -33.41, -70.5706],
  ['Ñuñoa', -33.4569, -70.5986],
  ['Maipú', -33.5103, -70.758],
  ['Puente Alto', -33.6116, -70.5758],
  ['La Florida', -33.5233, -70.5878],
  ['San Bernardo', -33.5921, -70.6986],
  ['Quilicura', -33.3614, -70.7327],
  ['Peñalolén', -33.4882, -70.5327],
  ['Recoleta', -33.4103, -70.6386],
  ['Vitacura', -33.3956, -70.5731],
  ['Huechuraba', -33.3702, -70.6436],
  ['La Reina', -33.4497, -70.5408],
  ['Lo Barnechea', -33.3519, -70.5197],
  ['Estación Central', -33.4697, -70.68],
  ['Valparaíso', -33.0458, -71.6197],
  ['Viña del Mar', -33.0245, -71.5518],
  ['Quilpué', -33.0503, -71.4408],
  ['Concepción', -36.827, -73.0503],
  ['Talcahuano', -36.7236, -73.1139],
  ['Chillán', -36.6066, -72.1034],
  ['Los Ángeles', -37.47, -72.3533],
  ['Temuco', -38.7359, -72.5904],
  ['Puerto Montt', -41.4717, -72.9367],
  ['Osorno', -40.5744, -73.1328],
  ['Antofagasta', -23.6509, -70.3975],
  ['Calama', -22.4564, -68.9183],
  ['Iquique', -20.2208, -70.1431],
  ['Arica', -18.4783, -70.3126],
  ['La Serena', -29.9027, -71.2519],
  ['Coquimbo', -29.9581, -71.3386],
  ['Copiapó', -27.3667, -70.3319],
  ['Rancagua', -34.1703, -70.7397],
  ['Talca', -35.4264, -71.6554],
  ['Curicó', -34.9819, -71.2381],
  ['Valdivia', -39.8142, -73.2459],
  ['Punta Arenas', -53.1638, -70.9171],
];

const TIPOS: TipoEmpleo[] = [
  'full-time',
  'full-time',
  'full-time',
  'part-time',
  'freelance',
  'practica',
];

const TITULOS: Record<string, string[]> = {
  Tecnología: [
    'Desarrollador/a Full Stack', 'Ingeniero/a de Software', 'Desarrollador/a Frontend',
    'Desarrollador/a Backend', 'Data Analyst', 'Ingeniero/a DevOps', 'QA Automation',
    'Product Owner', 'Scrum Master', 'Especialista en Ciberseguridad', 'Soporte TI',
    'Administrador/a de Bases de Datos', 'Ingeniero/a de Datos', 'Mobile Developer',
    'Arquitecto/a de Software', 'Analista Funcional', 'Site Reliability Engineer',
  ],
  Ventas: [
    'Ejecutivo/a de Ventas', 'KAM Retail', 'Vendedor/a de Terreno', 'Supervisor/a de Ventas',
    'Ejecutivo/a B2B', 'Asesor/a Comercial', 'Cajero/a-Vendedor/a', 'Account Manager',
    'Representante de Cuentas', 'Closer comercial', 'Ejecutivo/a Televentas',
  ],
  Marketing: [
    'Community Manager', 'Analista de Marketing Digital', 'Content Manager',
    'Especialista SEO/SEM', 'Diseñador/a de Campañas', 'Brand Manager',
    'Growth Analyst', 'Coordinador/a de Comunicaciones', 'Performance Media',
  ],
  Finanzas: [
    'Analista Contable', 'Analista Financiero', 'Tesorero/a', 'Auditor/a Junior',
    'Contador/a General', 'Analista de Costos', 'Credit Analyst', 'Controller Junior',
    'Asistente de Contabilidad', 'Especialista Tributario',
  ],
  Administración: [
    'Asistente Administrativo/a', 'Recepcionista', 'Office Manager',
    'Coordinador/a de Operaciones Admin', 'Secretario/a Ejecutivo/a',
    'Analista de Gestión', 'Encargado/a de Compras', 'Asistente de Gerencia',
  ],
  Salud: [
    'Enfermero/a Clínico', 'Técnico/a en Enfermería', 'Kinesiólogo/a',
    'Tens de Urgencia', 'Químico/a Farmacéutico', 'Matron/a',
    'Tecnólogo/a Médico', 'Auxiliar de Enfermería', 'Coordinador/a de Salud',
  ],
  Educación: [
    'Profesor/a de Educación Básica', 'Educador/a de Párvulos', 'Profesor/a de Inglés',
    'Psicopedagogo/a', 'Coordinador/a Académico', 'Profesor/a de Matemáticas',
    'Asistente de Aula', 'Orientador/a Educacional',
  ],
  Operaciones: [
    'Supervisor/a de Bodega', 'Operario/a de Producción', 'Planificador/a Logístico',
    'Chofer de Reparto', 'Encargado/a de Inventario', 'Jefe/a de Turno',
    'Analista de Supply Chain', 'Operario/a de Centro de Distribución',
  ],
  Diseño: [
    'Diseñador/a Gráfico', 'Diseñador/a UX/UI', 'Director/a de Arte Junior',
    'Ilustrador/a', 'Diseñador/a de Producto', 'Motion Designer',
    'Diseñador/a Editorial',
  ],
  Legal: [
    'Abogado/a Corporativo', 'Asistente Legal', 'Procurador/a',
    'Abogado/a Laboral', 'Compliance Analyst', 'Abogado/a Civil',
  ],
  Otro: [
    'Asistente General', 'Coordinador/a de Proyectos', 'Analista Junior',
    'Practicante multidisciplinario', 'Encargado/a de Atención al Cliente',
  ],
};

const EMPRESAS = [
  'Andes Digital SpA', 'Cordillera Salud', 'Pacífico Retail', 'Norte Minero Ltda',
  'Sur Austral Logística', 'Mapocho Consultores', 'Valle Central Alimentos',
  'Costa Pacífico Turismo', 'Altos del Maipo Energía', 'Bosque Nativo Forestal',
  'Río Claro Agrícola', 'Puerto Seco Transportes', 'Luz del Sur Servicios',
  'Atacama Solar', 'Patagonia Outdoor', 'Chiloe Mariscos', 'Aconcagua Viñedos',
  'Santiago Hub SpA', 'Biobío Industria', 'Araucanía Educa', 'Tarapacá Comercio',
  'Maule Agroexport', 'OHiggins Construcciones', 'Los Lagos Salmones',
  'Magallanes Servicios', 'Coquimbo Pesca', 'Antofagasta Ingeniería',
  'Ñuble Alimentos', 'Maule Textil', 'Centro Médico Cordillera',
  'Clínica del Valle', 'Colegio Los Alerces', 'Instituto Pacífico',
  'Estudio Jurídico Plaza Italia', 'Abogados del Sur', 'Finanzas Andinas',
  'Banco del Valle (filial)', 'Seguros Estrella', 'Inmobiliaria Los Peumos',
  'Constructora Rucacura', 'Retail Andes', 'Supermercados del Centro',
  'Farmacias del Pacífico', 'Laboratorio BioAndes', 'TechSur Chile',
  'Datos Claros Analytics', 'Nube Austral', 'Ciber Andes', 'AppSur Desarrollo',
];

export type PublicOferta = {
  id: string;
  titulo: string;
  descripcion: string;
  empresa: string;
  tipo_empleo: TipoEmpleo;
  categoria: string;
  comuna: string;
  lat: number;
  lng: number;
  activa: boolean;
  expira_en: string;
  empleador_id: string;
  created_at: string;
};

function demoUuid(i: number): string {
  return `eeeeeeee-0000-4000-8000-${String(i).padStart(12, '0')}`;
}

function jitter(n: number, amount: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * amount;
}

let cache: PublicOferta[] | null = null;

export function getDemoOfertas(): PublicOferta[] {
  if (cache) return cache;
  const now = Date.now();
  const cats = Object.keys(TITULOS);
  const rows: PublicOferta[] = [];
  for (let i = 1; i <= DEMO_TOTAL; i++) {
    const cat = cats[i % cats.length];
    const titles = TITULOS[cat];
    const titulo = titles[i % titles.length];
    const empresa = EMPRESAS[i % EMPRESAS.length];
    const tipo = TIPOS[i % TIPOS.length];
    const [comuna, lat0, lng0] = COMUNAS[i % COMUNAS.length];
    const lat = +(lat0 + jitter(i, 0.02)).toFixed(6);
    const lng = +(lng0 + jitter(i + 7, 0.02)).toFixed(6);
    const daysAgo = i % 21;
    const daysLive = 90 + (i % 90);
    rows.push({
      id: demoUuid(i),
      titulo,
      descripcion:
        `Buscamos ${titulo.toLowerCase()} para unirse a ${empresa} en ${comuna}. ` +
        `Trabajo ${tipo.replace('-', ' ')} en ${cat.toLowerCase()}. ` +
        `Requisitos: experiencia afín, trabajo en equipo y ganas de aportar.`,
      empresa,
      tipo_empleo: tipo,
      categoria: cat,
      comuna,
      lat,
      lng,
      activa: true,
      expira_en: new Date(now + daysLive * 86400000).toISOString(),
      empleador_id: DEMO_EMPLEADOR_ID,
      created_at: new Date(now - daysAgo * 86400000).toISOString(),
    });
  }
  cache = rows;
  return rows;
}

export function getDemoOferta(id: string): PublicOferta | undefined {
  return getDemoOfertas().find((o) => o.id === id);
}

export function filterDemoOfertas(opts: {
  q?: string;
  tipo?: string;
  comuna?: string;
  categoria?: string;
}): PublicOferta[] {
  const q = (opts.q || '').trim().toLowerCase();
  const tipo = opts.tipo || '';
  const comuna = (opts.comuna || '').trim().toLowerCase();
  const categoria = opts.categoria || '';
  const nowIso = new Date().toISOString();
  return getDemoOfertas()
    .filter((o) => o.activa && o.expira_en >= nowIso)
    .filter((o) => !q || o.titulo.toLowerCase().includes(q) || o.empresa.toLowerCase().includes(q))
    .filter((o) => !tipo || o.tipo_empleo === tipo)
    .filter((o) => !comuna || o.comuna.toLowerCase().includes(comuna))
    .filter((o) => !categoria || o.categoria === categoria)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}
