/**
 * Catálogo de skills orientado al mercado laboral chileno.
 * Matching case-insensitive + normalización de acentos.
 */

export const SKILLS_TECNICAS: string[] = [
  // Software / IT
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby',
  'Kotlin', 'Swift', 'Scala', 'R', 'MATLAB', 'SQL', 'NoSQL', 'GraphQL', 'REST', 'SOAP',
  'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'Astro', 'Node.js', 'Express', 'NestJS',
  'Django', 'Flask', 'FastAPI', 'Spring', 'Laravel', '.NET', 'ASP.NET',
  'HTML', 'CSS', 'Tailwind', 'SASS', 'Bootstrap',
  'PostgreSQL', 'MySQL', 'SQL Server', 'Oracle', 'MongoDB', 'Redis', 'Elasticsearch',
  'Firebase', 'Supabase', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
  'CI/CD', 'Git', 'GitHub', 'GitLab', 'Jenkins', 'Linux', 'Bash',
  'Power BI', 'Tableau', 'Excel', 'Google Sheets', 'Looker', 'Metabase',
  'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Machine Learning',
  'Data Science', 'ETL', 'dbt', 'Airflow', 'Spark', 'BigQuery', 'Snowflake',
  'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'After Effects', 'Premiere',
  'SAP', 'Salesforce', 'HubSpot', 'Jira', 'Confluence', 'Notion', 'Trello',
  'WordPress', 'Shopify', 'WooCommerce', 'Magento',
  'Selenium', 'Cypress', 'Playwright', 'Jest', 'Pytest', 'Postman',
  'Android', 'iOS', 'Flutter', 'React Native',
  // Contabilidad / finanzas Chile
  'IFRS', 'NIIF', 'Contabilidad', 'Auditoría', 'Presupuestos', 'Tesorería',
  'Facturación electrónica', 'SII', 'IVA', 'Renta', 'ERP', 'Softland', 'Defontana',
  'Manager', 'Random', 'Tango', 'Bsale', 'Nubox',
  // Marketing / ventas
  'SEO', 'SEM', 'Google Ads', 'Meta Ads', 'Email Marketing', 'CRM',
  'Copywriting', 'Social Media', 'Community Management', 'Google Analytics',
  'Inbound Marketing', 'Outbound', 'Cold Calling', 'Negociación',
  // Operaciones / logística
  'Logística', 'Supply Chain', 'Inventario', 'WMS', 'Lean', 'Six Sigma', 'Kaizen',
  'ISO 9001', 'ISO 27001', 'BPM', 'PMP', 'Scrum', 'Agile', 'Kanban',
  // Salud
  'Enfermería', 'UCI', 'Farmacia', 'Rayos X', 'Laboratorio clínico',
  // Legal
  'Derecho laboral', 'Derecho civil', 'Contratos', 'Compliance', 'Due Diligence',
  // RRHH
  'Reclutamiento', 'Selección', 'People Analytics', 'Compensaciones', 'Onboarding',
  'Evaluación de desempeño', 'Capacitación',
  // Idiomas / tools genéricas
  'Office', 'Microsoft Office', 'Word', 'PowerPoint', 'Outlook', 'Teams',
  'Zoom', 'Slack', 'AutoCAD', 'Revit', 'SolidWorks', 'SketchUp',
];

export const SKILLS_BLANDAS: string[] = [
  'Liderazgo', 'Trabajo en equipo', 'Comunicación', 'Comunicación efectiva',
  'Resolución de problemas', 'Pensamiento crítico', 'Adaptabilidad',
  'Proactividad', 'Orientación al cliente', 'Orientación a resultados',
  'Gestión del tiempo', 'Organización', 'Creatividad', 'Empatía',
  'Negociación', 'Persuasión', 'Autonomía', 'Responsabilidad',
  'Aprendizaje continuo', 'Inteligencia emocional', 'Colaboración',
  'Toma de decisiones', 'Gestión de conflictos', 'Mentoría',
  'Presentaciones', 'Storytelling', 'Resiliencia', 'Iniciativa',
  'Multitasking', 'Atención al detalle', 'Escucha activa',
];

/** Comunas / ciudades frecuentes en CVs chilenos (subset + capitales regionales) */
export const UBICACIONES_CHILE: string[] = [
  'Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'Maipú', 'La Florida',
  'Puente Alto', 'San Bernardo', 'Quilicura', 'Recoleta', 'Independencia',
  'Estación Central', 'Macul', 'Peñalolén', 'La Reina', 'Vitacura', 'Lo Barnechea',
  'Huechuraba', 'Conchalí', 'Renca', 'Cerrillos', 'El Bosque', 'La Cisterna',
  'La Granja', 'La Pintana', 'Lo Espejo', 'Lo Prado', 'Pedro Aguirre Cerda',
  'Quinta Normal', 'San Joaquín', 'San Miguel', 'San Ramón', 'Cerro Navia',
  'Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Concón',
  'Concepción', 'Talcahuano', 'San Pedro de la Paz', 'Chiguayante',
  'La Serena', 'Coquimbo', 'Antofagasta', 'Calama', 'Iquique', 'Alto Hospicio',
  'Temuco', 'Padre Las Casas', 'Rancagua', 'Machalí', 'Talca', 'Curicó',
  'Chillán', 'Los Ángeles', 'Valdivia', 'Osorno', 'Puerto Montt', 'Puerto Varas',
  'Arica', 'Copiapó', 'Coyhaique', 'Punta Arenas', 'Región Metropolitana',
  'RM', 'Chile',
];

export const IDIOMAS_COMUNES: string[] = [
  'Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano',
  'Mandarín', 'Chino', 'Japonés', 'Coreano', 'Mapudungún', 'Quechua',
];

const NIVELES_IDIOMA = [
  'nativo', 'bilingüe', 'bilingue', 'fluido', 'avanzado', 'intermedio',
  'básico', 'basico', 'conversacional', 'técnico', 'tecnico',
  'a1', 'a2', 'b1', 'b2', 'c1', 'c2',
];

export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^\w+#.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Detecta skills del catálogo presentes en el texto */
export function matchCatalogSkills(
  text: string,
  catalog: string[],
): string[] {
  const normText = normalizeForMatch(text);
  const found: string[] = [];

  for (const skill of catalog) {
    const n = normalizeForMatch(skill);
    if (n.length < 2) continue;
    // word-boundary-ish match
    const re = new RegExp(
      `(?:^|[^a-z0-9+#])${escapeRegex(n)}(?:[^a-z0-9+#]|$)`,
      'i',
    );
    if (re.test(normText)) found.push(skill);
  }

  return found;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function detectIdiomas(text: string): { idioma: string; nivel: string | null }[] {
  const lines = text.split(/\n+/);
  const results: { idioma: string; nivel: string | null }[] = [];
  const seen = new Set<string>();

  for (const idioma of IDIOMAS_COMUNES) {
    const nId = normalizeForMatch(idioma);
    for (const line of lines) {
      const nLine = normalizeForMatch(line);
      if (!nLine.includes(nId)) continue;
      if (seen.has(nId)) continue;
      // Evitar falsos positivos en "español" solo por ser CV en español
      if (nId === 'espanol' && !/idioma|lengua|language|nivel/i.test(line)) continue;

      let nivel: string | null = null;
      for (const niv of NIVELES_IDIOMA) {
        if (nLine.includes(niv)) {
          nivel = niv;
          break;
        }
      }
      seen.add(nId);
      results.push({ idioma, nivel });
      break;
    }
  }

  return results;
}

export function detectUbicacion(text: string): string | null {
  const head = text.slice(0, 1500);
  const normHead = normalizeForMatch(head);

  // Priorizar menciones explícitas
  const explicit = head.match(
    /(?:ubicaci[oó]n|comuna|ciudad|reside(?:nte)?\s+en|domicilio)\s*[:\-]?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ\s']{3,40})/i,
  );
  if (explicit?.[1]) {
    const candidate = explicit[1].trim().replace(/[,.].*$/, '').trim();
    if (candidate.length >= 3) return candidate;
  }

  for (const u of UBICACIONES_CHILE) {
    if (u === 'Chile' || u === 'RM') continue;
    const n = normalizeForMatch(u);
    if (n.length < 4) continue;
    const re = new RegExp(`(?:^|[^a-z])${escapeRegex(n)}(?:[^a-z]|$)`, 'i');
    if (re.test(normHead)) return u;
  }

  return null;
}
