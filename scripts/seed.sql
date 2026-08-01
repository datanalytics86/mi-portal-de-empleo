-- ============================================================
-- SEED DE DATOS DE PRUEBA — Portal de Empleos Chile
-- ============================================================
-- Cómo ejecutar:
--   1. Abrir Supabase Dashboard > SQL Editor
--   2. Si ya corriste este seed antes, ejecuta primero scripts/seed-cleanup.sql
--   3. Pegar y ejecutar este archivo completo (seed.sql)
--
-- Cuentas de prueba (contraseña para ambas: TestPass123!):
--   Empleador 1: test-empresa1@test.cl  → TechCorp Chile
--   Empleador 2: test-empresa2@test.cl  → Salud Conecta
--
-- Datos creados:
--   • 2 empleadores (auth.users + auth.identities + public.empleadores)
--   • 12 ofertas (9 originales + 3 nuevas: Marketing, Educación, Legal)
--   • 24+ postulaciones con keywords, cv_parsed, parse_status y match_score
--
-- Notas:
--   • UUIDs fijos → re-ejecutar es seguro (ON CONFLICT DO NOTHING)
--   • tipo_empleo: full-time | part-time | freelance | practica
--   • parse_status: pending | success | failed | skipped
-- ============================================================

BEGIN;

-- ============================================================
-- 1. CREAR USUARIOS EN auth.users
-- ============================================================

-- Empleador 1: TechCorp Chile
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'aaaaaaaa-1111-1111-1111-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test-empresa1@test.cl',
  crypt('TestPass123!', gen_salt('bf', 10)),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"empresa": "TechCorp Chile"}',
  NOW(),
  NOW(),
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Empleador 2: Salud Conecta
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'aaaaaaaa-2222-2222-2222-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test-empresa2@test.cl',
  crypt('TestPass123!', gen_salt('bf', 10)),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"empresa": "Salud Conecta"}',
  NOW(),
  NOW(),
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 1b. CREAR IDENTIDADES EN auth.identities
--     Supabase requiere un registro por usuario en esta tabla
--     para que signInWithPassword funcione con email/password.
-- ============================================================

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
(
  'aaaaaaaa-1111-1111-1111-000000000001',
  'aaaaaaaa-1111-1111-1111-000000000001',
  '{"sub": "aaaaaaaa-1111-1111-1111-000000000001", "email": "test-empresa1@test.cl"}',
  'email',
  'test-empresa1@test.cl',
  NOW(),
  NOW(),
  NOW()
),
(
  'aaaaaaaa-2222-2222-2222-000000000002',
  'aaaaaaaa-2222-2222-2222-000000000002',
  '{"sub": "aaaaaaaa-2222-2222-2222-000000000002", "email": "test-empresa2@test.cl"}',
  'email',
  'test-empresa2@test.cl',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. CREAR REGISTROS EN public.empleadores
-- ============================================================

INSERT INTO public.empleadores (id, email, empresa, created_at)
VALUES
  ('aaaaaaaa-1111-1111-1111-000000000001', 'test-empresa1@test.cl', 'TechCorp Chile', NOW()),
  ('aaaaaaaa-2222-2222-2222-000000000002', 'test-empresa2@test.cl', 'Salud Conecta',  NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. CREAR OFERTAS (12 total: 9 originales + 3 nuevas)
-- ============================================================

INSERT INTO public.ofertas (
  id, titulo, descripcion, empresa, tipo_empleo, categoria,
  comuna, lat, lng, activa, expira_en, empleador_id, created_at
) VALUES

-- === TechCorp Chile (empleador 1) ===

(
  'bbbbbbbb-1111-1111-1111-000000000001',
  'Desarrollador Full Stack React + Node.js',
  'Buscamos desarrollador full stack con experiencia en React 18, Node.js y bases de datos PostgreSQL. Trabajarás en un equipo ágil construyendo productos SaaS para el mercado latinoamericano.

Responsabilidades:
- Desarrollar y mantener aplicaciones web con React y TypeScript.
- Diseñar e implementar APIs REST con Node.js y Express.
- Colaborar con el equipo de diseño para implementar interfaces de usuario.
- Participar en code reviews y sprints de 2 semanas.

Requisitos:
- 3+ años de experiencia en desarrollo web.
- Dominio de React, TypeScript y Node.js.
- Experiencia con PostgreSQL o similar.
- Conocimiento de Git y metodologías ágiles.
- Inglés intermedio (lectura de documentación).

Ofrecemos:
- Trabajo 100% remoto con 2 días opcionales en oficina.
- Sueldo entre $2.500.000 y $3.500.000 CLP bruto.
- Bono de desempeño semestral.
- Seguro de salud complementario.
- 15 días de vacaciones al año (adicionales al legal).',
  'TechCorp Chile',
  'full-time',
  'Tecnología',
  'Providencia',
  -33.4328, -70.6099,
  TRUE,
  NOW() + INTERVAL '28 days',
  'aaaaaaaa-1111-1111-1111-000000000001',
  NOW() - INTERVAL '3 days'
),

(
  'bbbbbbbb-2222-2222-2222-000000000002',
  'Diseñador UX/UI Senior',
  'Nos encontramos en búsqueda de un Diseñador UX/UI Senior para liderar el diseño de nuestros productos digitales. Si te apasiona crear experiencias de usuario excepcionales y tienes ojo para el detalle visual, este es tu lugar.

Responsabilidades:
- Liderar el proceso de diseño desde la investigación hasta la entrega de assets.
- Crear wireframes, prototipos interactivos y sistemas de diseño en Figma.
- Realizar pruebas de usabilidad con usuarios reales.
- Colaborar estrechamente con el equipo de desarrollo.

Requisitos:
- 4+ años de experiencia en UX/UI.
- Portfolio sólido con casos de estudio detallados.
- Dominio de Figma y Adobe Creative Suite.
- Experiencia con design systems y componentes reutilizables.

Ofrecemos:
- Modalidad híbrida (3 días remoto, 2 en oficina).
- Sueldo entre $2.200.000 y $3.000.000 CLP.
- Budget anual de $300.000 para capacitación.',
  'TechCorp Chile',
  'full-time',
  'Diseño',
  'Las Condes',
  -33.4100, -70.5706,
  TRUE,
  NOW() + INTERVAL '14 days',
  'aaaaaaaa-1111-1111-1111-000000000001',
  NOW() - INTERVAL '7 days'
),

(
  'bbbbbbbb-3333-3333-3333-000000000003',
  'Analista de Datos / Data Analyst',
  'TechCorp Chile busca un Analista de Datos para transformar grandes volúmenes de información en insights accionables para el negocio. Trabajarás con el equipo de producto y ventas.

Responsabilidades:
- Construir dashboards e informes en Metabase y Tableau.
- Realizar consultas SQL complejas sobre nuestra base de datos.
- Identificar tendencias y oportunidades de negocio a partir de datos.
- Automatizar reportes recurrentes.

Requisitos:
- 2+ años de experiencia en análisis de datos.
- SQL avanzado (PostgreSQL preferido).
- Experiencia con Python o R para análisis estadístico.
- Conocimiento de herramientas de BI (Metabase, Tableau, Power BI).

Ofrecemos:
- Trabajo remoto con horario flexible.
- Sueldo entre $1.800.000 y $2.500.000 CLP.
- Acceso a plataformas de e-learning.',
  'TechCorp Chile',
  'full-time',
  'Tecnología',
  'Santiago',
  -33.4569, -70.6483,
  TRUE,
  NOW() + INTERVAL '5 days',
  'aaaaaaaa-1111-1111-1111-000000000001',
  NOW() - INTERVAL '25 days'
),

(
  'bbbbbbbb-4444-4444-4444-000000000004',
  'Ejecutivo de Ventas B2B (Remoto)',
  'Buscamos un Ejecutivo de Ventas con experiencia en venta consultiva B2B para expandir nuestra cartera de clientes corporativos en el sector tecnológico.

Responsabilidades:
- Prospectar y calificar nuevas oportunidades de negocio.
- Gestionar el ciclo completo de ventas desde el primer contacto hasta el cierre.
- Presentar demos del producto a tomadores de decisión.
- Mantener actualizado el CRM (HubSpot).

Requisitos:
- 3+ años en ventas B2B de software o tecnología.
- Habilidades sólidas de negociación y presentación.
- Experiencia con CRM (HubSpot, Salesforce).
- Inglés avanzado (deseable).

Ofrecemos:
- Sueldo base $1.500.000 + comisiones sin tope.
- Trabajo 100% remoto.
- Capacitación en ventas consultivas.',
  'TechCorp Chile',
  'full-time',
  'Ventas',
  'Maipú',
  -33.5103, -70.7580,
  TRUE,
  NOW() + INTERVAL '21 days',
  'aaaaaaaa-1111-1111-1111-000000000001',
  NOW() - INTERVAL '1 day'
),

-- Oferta expirada de TechCorp (para probar el contador de expiradas)
(
  'bbbbbbbb-5555-5555-5555-000000000005',
  'Pasante Desarrollo Web (Práctica)',
  'Ofrecemos práctica profesional para estudiantes de Ingeniería en Computación o carreras afines. Aprenderás con un equipo senior en proyectos reales.

Requisitos:
- Estudiante de último año o recién egresado.
- Conocimientos básicos de HTML, CSS y JavaScript.
- Disponibilidad para 6 meses de práctica.

Ofrecemos:
- Asignación mensual de $400.000 CLP.
- Posibilidad de contrato al término de la práctica.',
  'TechCorp Chile',
  'practica',
  'Tecnología',
  'Quilicura',
  -33.3614, -70.7327,
  TRUE,
  NOW() - INTERVAL '2 days',
  'aaaaaaaa-1111-1111-1111-000000000001',
  NOW() - INTERVAL '32 days'
),

-- === Salud Conecta (empleador 2) ===

(
  'bbbbbbbb-6666-6666-6666-000000000006',
  'Médico General para Atención Primaria',
  'Salud Conecta busca médico general para fortalecer nuestro equipo de atención primaria en Concepción. Modalidad presencial con turno diurno fijo.

Responsabilidades:
- Atención de consultas generales y controles de salud.
- Gestión de derivaciones a especialistas.
- Participación en programas de salud pública.
- Registro de atenciones en sistema electrónico (SIGFE).

Requisitos:
- Título de Médico Cirujano con registro en Superintendencia de Salud.
- Experiencia en atención primaria (deseable).
- Manejo de ficha clínica electrónica.

Ofrecemos:
- Sueldo entre $3.500.000 y $4.500.000 CLP según experiencia.
- Contrato indefinido.
- Seguro de responsabilidad civil profesional.
- Bono de zona.',
  'Salud Conecta',
  'full-time',
  'Salud',
  'Concepción',
  -36.8270, -73.0503,
  TRUE,
  NOW() + INTERVAL '20 days',
  'aaaaaaaa-2222-2222-2222-000000000002',
  NOW() - INTERVAL '5 days'
),

(
  'bbbbbbbb-7777-7777-7777-000000000007',
  'Enfermero/a Urgencias — Turno Noche',
  'Incorporamos enfermero/a con experiencia en urgencias para turno nocturno en nuestra clínica de Viña del Mar. Trabajo en equipo multidisciplinario de alta exigencia.

Responsabilidades:
- Gestión y triaje de pacientes en urgencias.
- Administración de medicamentos y procedimientos de enfermería.
- Registro de atenciones y evolución clínica.
- Coordinación con médicos de turno.

Requisitos:
- Título de Enfermero/a con registro en Superintendencia de Salud.
- 2+ años de experiencia en urgencias o UCI.
- Manejo de vía venosa, PCR y procedimientos básicos.

Ofrecemos:
- Sueldo base $1.800.000 + bono nocturno $400.000.
- Turno 5×2 (12 horas).
- Casino de trabajadores.',
  'Salud Conecta',
  'full-time',
  'Salud',
  'Viña del Mar',
  -33.0245, -71.5518,
  TRUE,
  NOW() + INTERVAL '10 days',
  'aaaaaaaa-2222-2222-2222-000000000002',
  NOW() - INTERVAL '2 days'
),

(
  'bbbbbbbb-8888-8888-8888-000000000008',
  'Nutricionista Clínica Part-Time',
  'Salud Conecta requiere nutricionista para atención de pacientes crónicos (diabetes, obesidad, HTA) en nuestra sede de Temuco. Jornada parcial mañanas.

Responsabilidades:
- Evaluación nutricional y diseño de planes dietéticos personalizados.
- Educación alimentaria a pacientes y familias.
- Seguimiento y control evolutivo de pacientes.

Requisitos:
- Título de Nutricionista con registro vigente.
- Experiencia en pacientes crónicos (deseable).
- Buenas habilidades de comunicación.

Ofrecemos:
- Sueldo $900.000 CLP jornada media (22 hrs semanales).
- Horario fijo lunes a viernes 8:00–13:00.
- Ambiente de trabajo colaborativo.',
  'Salud Conecta',
  'part-time',
  'Salud',
  'Temuco',
  -38.7359, -72.5904,
  TRUE,
  NOW() + INTERVAL '18 days',
  'aaaaaaaa-2222-2222-2222-000000000002',
  NOW() - INTERVAL '4 days'
),

(
  'bbbbbbbb-9999-9999-9999-000000000009',
  'Administrativo/a Clínica — Recepción',
  'Buscamos administrativo para la recepción de nuestra clínica en Santiago. Será el primer punto de contacto con pacientes, por lo que buscamos una persona amable, organizada y con excelente presentación.

Responsabilidades:
- Recepción y agenda de pacientes.
- Facturación y cobro (ISAPRE/FONASA/Particular).
- Gestión de fichas clínicas en sistema.
- Atención telefónica y de correo electrónico.

Requisitos:
- Experiencia en recepción o atención al cliente.
- Manejo de Office (Excel y Word).
- Experiencia en sector salud (deseable).

Ofrecemos:
- Sueldo $700.000 CLP + colación + movilización.
- Contrato indefinido tras 3 meses de prueba.
- Horario fijo (lunes a viernes 9:00–18:00).',
  'Salud Conecta',
  'full-time',
  'Administración',
  'Ñuñoa',
  -33.4569, -70.5986,
  TRUE,
  NOW() + INTERVAL '25 days',
  'aaaaaaaa-2222-2222-2222-000000000002',
  NOW() - INTERVAL '6 days'
),

-- === Ofertas nuevas (IDs aaaa / bbbb / cccc) ===

-- Marketing digital full-time — TechCorp (urgencia + badge Nueva)
(
  'bbbbbbbb-aaaa-aaaa-aaaa-00000000000a',
  'Especialista en Marketing Digital',
  'TechCorp Chile busca un Especialista en Marketing Digital para potenciar la adquisición y retención de clientes B2B en Chile y LatAm. Rol full-time con foco en performance y brand.

Responsabilidades:
- Planificar y ejecutar campañas en Google Ads, Meta Ads y LinkedIn Ads.
- Optimizar embudos de conversión y landing pages (CRO).
- Analizar métricas en GA4, Search Console y dashboards de marketing.
- Coordinar con producto y ventas el contenido de demos y webinars.
- Gestionar presupuesto publicitario mensual y reporting a gerencia.

Requisitos:
- 3+ años en marketing digital B2B o SaaS.
- Experiencia comprobable en Google Ads y Meta Ads.
- Manejo de SEO on-page, email marketing y automatización (HubSpot o similar).
- Excelente redacción en español; inglés intermedio deseable.

Ofrecemos:
- Sueldo entre $1.800.000 y $2.600.000 CLP según experiencia.
- Modalidad híbrida en Vitacura (3 días oficina / 2 remoto).
- Presupuesto de herramientas (Semrush, Canva Pro, etc.).
- Capacitaciones y certificaciones pagadas.',
  'TechCorp Chile',
  'full-time',
  'Marketing',
  'Vitacura',
  -33.3900, -70.5800,
  TRUE,
  NOW() + INTERVAL '1 day',
  'aaaaaaaa-1111-1111-1111-000000000001',
  NOW() - INTERVAL '3 hours'
),

-- Educación part-time — Salud Conecta
(
  'bbbbbbbb-bbbb-bbbb-bbbb-00000000000b',
  'Profesor/a Particular de Ciencias (Part-Time)',
  'Salud Conecta abre un programa de apoyo educativo para hijos de colaboradores y pacientes pediátricos. Buscamos profesor/a particular de Ciencias (Biología y Química) en modalidad part-time.

Responsabilidades:
- Impartir clases particulares y en grupos pequeños (2–6 alumnos).
- Preparar material didáctico alineado al curriculum MINEDUC.
- Realizar evaluaciones diagnósticas y seguimiento de avance.
- Coordinar horarios con familias y con el área de bienestar.

Requisitos:
- Título de Pedagogía en Biología/Química o licenciatura afín en curso o egresado.
- Experiencia previa en clases particulares o refuerzo escolar (deseable).
- Paciencia, empatía y buena comunicación con adolescentes.
- Disponibilidad de al menos 12 hrs semanales (tardes).

Ofrecemos:
- Pago por hora $12.000–$18.000 CLP según experiencia.
- Jornada part-time flexible en Providencia.
- Materiales y sala de apoyo disponibles.
- Contrato a honorarios renovable por semestre.',
  'Salud Conecta',
  'part-time',
  'Educación',
  'Providencia',
  -33.4328, -70.6099,
  TRUE,
  NOW() + INTERVAL '3 days',
  'aaaaaaaa-2222-2222-2222-000000000002',
  NOW() - INTERVAL '8 hours'
),

-- Legal junior freelance — TechCorp
(
  'bbbbbbbb-cccc-cccc-cccc-00000000000c',
  'Abogado/a Junior Freelance — Contratos y Cumplimiento',
  'TechCorp Chile busca abogado/a junior en modalidad freelance para apoyar al área legal en revisión de contratos comerciales, términos de servicio y cumplimiento normativo (Ley 19.628 y DF 19).

Responsabilidades:
- Revisar y redactar minutas de contratos de software y SaaS.
- Apoyar en políticas de privacidad y términos y condiciones.
- Investigar normativa laboral y de protección de datos aplicable.
- Coordinar con el asesor legal externo en casos complejos.

Requisitos:
- Título de Abogado/a o egresado en trámite de juramento.
- 1–3 años de experiencia (estudio jurídico o empresa tech deseable).
- Conocimiento básico de derecho comercial y protección de datos.
- Manejo de Word y herramientas colaborativas (Google Workspace).
- Disponibilidad de al menos 15–20 hrs semanales.

Ofrecemos:
- Honorarios por proyecto o por hora ($15.000–$25.000 CLP/hr).
- Trabajo 100% remoto con reuniones semanales.
- Experiencia real en legaltech / startup.
- Posibilidad de paso a part-time o full-time a 6 meses.',
  'TechCorp Chile',
  'freelance',
  'Legal',
  'Las Condes',
  -33.4100, -70.5706,
  TRUE,
  NOW() + INTERVAL '30 days',
  'aaaaaaaa-1111-1111-1111-000000000001',
  NOW() - INTERVAL '1 hour'
)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. CREAR POSTULACIONES (candidatos de prueba)
-- ============================================================
-- Columnas: id, oferta_id, nombre, email, cv_url, ip_address,
--           palabras_clave, keywords, cv_parsed, parse_status,
--           parsed_at, match_score, created_at
--
-- NOTA: cv_url apunta a rutas ficticias en el bucket 'cvs'.
-- En producción estas serían URLs firmadas de Supabase Storage.
-- parse_status: mayoría success; 2 pending; 1 failed.
-- ============================================================

INSERT INTO public.postulaciones (
  id, oferta_id, nombre, email, cv_url,
  ip_address, palabras_clave, keywords, cv_parsed,
  parse_status, parsed_at, match_score, created_at
) VALUES

-- ---------- Oferta 1: Desarrollador Full Stack ----------
(
  'cccccccc-0101-0101-0101-000000000001',
  'bbbbbbbb-1111-1111-1111-000000000001',
  'Matías González',
  'matias.gonzalez@gmail.com',
  'test/cvs/matias-gonzalez-cv.pdf',
  '190.160.1.1',
  ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
  ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
  '{
    "nombre_completo": "Matías González",
    "email": "matias.gonzalez@gmail.com",
    "telefono": "+56 9 8765 4321",
    "titulo_profesional": "Desarrollador Full Stack",
    "resumen": "Ingeniero civil informático con 4 años en React, Node.js y PostgreSQL. Experiencia en productos SaaS B2B.",
    "skills_tecnicas": ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker"],
    "skills_blandas": ["Trabajo en equipo", "Comunicación", "Resolución de problemas"],
    "keywords": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
    "anos_experiencia": 4,
    "ubicacion": "Santiago, Chile",
    "experiencia": [
      {"cargo": "Desarrollador Full Stack", "empresa": "Startup XYZ", "fecha_inicio": "2021-03", "fecha_fin": null, "descripcion": "Apps React + APIs Node"},
      {"cargo": "Desarrollador Frontend", "empresa": "Agencia Digital Sur", "fecha_inicio": "2019-06", "fecha_fin": "2021-02", "descripcion": "SPAs con React"}
    ],
    "educacion": [
      {"institucion": "Universidad de Chile", "titulo": "Ingeniería Civil en Computación", "fecha": "2019", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Intermedio"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 3200,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '2 days 3 hours',
  92,
  NOW() - INTERVAL '2 days 4 hours'
),
(
  'cccccccc-0102-0102-0102-000000000002',
  'bbbbbbbb-1111-1111-1111-000000000001',
  'Valentina Rojas',
  'vale.rojas.dev@outlook.com',
  'test/cvs/valentina-rojas-cv.pdf',
  '201.238.45.22',
  ARRAY['React', 'TypeScript', 'GraphQL', 'Docker'],
  ARRAY['React', 'TypeScript', 'GraphQL', 'Docker'],
  '{
    "nombre_completo": "Valentina Rojas",
    "email": "vale.rojas.dev@outlook.com",
    "telefono": "+56 9 7123 4567",
    "titulo_profesional": "Frontend Developer",
    "resumen": "Desarrolladora frontend con 3 años en React y TypeScript. Interés en GraphQL y arquitectura de componentes.",
    "skills_tecnicas": ["React", "TypeScript", "GraphQL", "Docker", "Jest"],
    "skills_blandas": ["Autonomía", "Mentoría junior"],
    "keywords": ["React", "TypeScript", "GraphQL", "Docker"],
    "anos_experiencia": 3,
    "ubicacion": "Providencia, Santiago",
    "experiencia": [
      {"cargo": "Frontend Developer", "empresa": "Fintech Andina", "fecha_inicio": "2021-01", "fecha_fin": null, "descripcion": "Dashboard React + GraphQL"}
    ],
    "educacion": [
      {"institucion": "PUC", "titulo": "Ingeniería Civil Industrial mención TI", "fecha": "2020", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Avanzado"}],
    "parse_method": "hybrid",
    "used_ocr": false,
    "raw_text_length": 2800,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '1 day 5 hours',
  78,
  NOW() - INTERVAL '1 day 6 hours'
),
(
  'cccccccc-0103-0103-0103-000000000003',
  'bbbbbbbb-1111-1111-1111-000000000001',
  'Diego Fuentes',
  'diego.fuentes@hotmail.com',
  'test/cvs/diego-fuentes-cv.pdf',
  '200.75.12.88',
  ARRAY['Node.js', 'Express', 'MongoDB', 'Vue.js'],
  ARRAY['Node.js', 'Express', 'MongoDB', 'Vue.js'],
  '{
    "nombre_completo": "Diego Fuentes",
    "email": "diego.fuentes@hotmail.com",
    "telefono": "+56 9 6543 2109",
    "titulo_profesional": "Desarrollador Backend",
    "resumen": "Backend con Node.js y Express. Experiencia en MongoDB y APIs REST; conocimiento básico de Vue.",
    "skills_tecnicas": ["Node.js", "Express", "MongoDB", "Vue.js", "REST"],
    "skills_blandas": ["Proactividad"],
    "keywords": ["Node.js", "Express", "MongoDB", "Vue.js"],
    "anos_experiencia": 2,
    "ubicacion": "Maipú, Santiago",
    "experiencia": [
      {"cargo": "Backend Developer", "empresa": "Ecommerce Local", "fecha_inicio": "2022-04", "fecha_fin": null, "descripcion": "APIs Node + MongoDB"}
    ],
    "educacion": [],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 1900,
    "warnings": ["pocos datos de educación"]
  }'::jsonb,
  'success',
  NOW() - INTERVAL '17 hours',
  55,
  NOW() - INTERVAL '18 hours'
),
(
  'cccccccc-0104-0104-0104-000000000004',
  'bbbbbbbb-1111-1111-1111-000000000001',
  'Camila Torres',
  'camila.torres.ing@gmail.com',
  'test/cvs/camila-torres-cv.pdf',
  '190.160.88.44',
  ARRAY['React', 'Redux', 'Jest', 'CI/CD', 'PostgreSQL'],
  ARRAY['React', 'Redux', 'Jest', 'CI/CD', 'PostgreSQL'],
  '{
    "nombre_completo": "Camila Torres",
    "email": "camila.torres.ing@gmail.com",
    "telefono": "+56 9 9988 7766",
    "titulo_profesional": "Ingeniera de Software",
    "resumen": "Full stack con foco en calidad: React, Redux, testing y pipelines CI/CD. 5 años de experiencia.",
    "skills_tecnicas": ["React", "Redux", "Jest", "CI/CD", "PostgreSQL", "GitHub Actions"],
    "skills_blandas": ["Liderazgo técnico", "Code review"],
    "keywords": ["React", "Redux", "Jest", "CI/CD", "PostgreSQL"],
    "anos_experiencia": 5,
    "ubicacion": "Las Condes, Santiago",
    "experiencia": [
      {"cargo": "Software Engineer", "empresa": "Banco Digital CL", "fecha_inicio": "2020-01", "fecha_fin": null, "descripcion": "Frontend y testing e2e"},
      {"cargo": "Dev Jr", "empresa": "Consultora TI", "fecha_inicio": "2018-03", "fecha_fin": "2019-12", "descripcion": "Mantención de apps web"}
    ],
    "educacion": [
      {"institucion": "UTFSM", "titulo": "Ingeniería Civil Informática", "fecha": "2018", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Intermedio-alto"}],
    "parse_method": "llm",
    "used_ocr": false,
    "raw_text_length": 4100,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '2 hours',
  88,
  NOW() - INTERVAL '3 hours'
),
(
  'cccccccc-0105-0105-0105-000000000005',
  'bbbbbbbb-1111-1111-1111-000000000001',
  NULL,
  'anonimo.dev@protonmail.com',
  'test/cvs/candidato-anonimo-cv.pdf',
  '179.58.200.1',
  ARRAY['JavaScript', 'Python', 'Django', 'React'],
  ARRAY['JavaScript', 'Python', 'Django', 'React'],
  NULL,
  'pending',
  NULL,
  NULL,
  NOW() - INTERVAL '45 minutes'
),

-- ---------- Oferta 2: Diseñador UX/UI ----------
(
  'cccccccc-0201-0201-0201-000000000006',
  'bbbbbbbb-2222-2222-2222-000000000002',
  'Sofía Mendoza',
  'sofia.ux@gmail.com',
  'test/cvs/sofia-mendoza-portfolio.pdf',
  '201.238.100.5',
  ARRAY['Figma', 'Adobe XD', 'Design System', 'User Research', 'Prototyping'],
  ARRAY['Figma', 'Adobe XD', 'Design System', 'User Research', 'Prototyping'],
  '{
    "nombre_completo": "Sofía Mendoza",
    "email": "sofia.ux@gmail.com",
    "telefono": "+56 9 5555 1212",
    "titulo_profesional": "Diseñadora UX/UI Senior",
    "resumen": "Diseñadora con 6 años creando productos digitales. Especialista en design systems y research cualitativo.",
    "skills_tecnicas": ["Figma", "Adobe XD", "Design System", "Prototyping", "FigJam"],
    "skills_blandas": ["Facilitación de workshops", "Empatía con usuarios"],
    "keywords": ["Figma", "Adobe XD", "Design System", "User Research", "Prototyping"],
    "anos_experiencia": 6,
    "ubicacion": "Santiago Centro",
    "experiencia": [
      {"cargo": "Lead UX", "empresa": "Producto SaaS LatAm", "fecha_inicio": "2019-05", "fecha_fin": null, "descripcion": "Design system y research"}
    ],
    "educacion": [
      {"institucion": "UDP", "titulo": "Diseño Gráfico", "fecha": "2016", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Avanzado"}],
    "parse_method": "hybrid",
    "used_ocr": true,
    "ocr_engine": "ocr_space",
    "raw_text_length": 2500,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '4 days 20 hours',
  90,
  NOW() - INTERVAL '5 days'
),
(
  'cccccccc-0202-0202-0202-000000000007',
  'bbbbbbbb-2222-2222-2222-000000000002',
  'Rodrigo Castillo',
  'rcastillo.design@gmail.com',
  'test/cvs/rodrigo-castillo-cv.pdf',
  '200.104.55.33',
  ARRAY['Figma', 'Illustrator', 'Photoshop', 'HTML/CSS'],
  ARRAY['Figma', 'Illustrator', 'Photoshop', 'HTML/CSS'],
  '{
    "nombre_completo": "Rodrigo Castillo",
    "email": "rcastillo.design@gmail.com",
    "telefono": "+56 9 3333 4444",
    "titulo_profesional": "Diseñador UI",
    "resumen": "Diseñador visual con 3 años. Fuerte en UI y assets; aprendiendo research y design systems.",
    "skills_tecnicas": ["Figma", "Illustrator", "Photoshop", "HTML", "CSS"],
    "skills_blandas": ["Creatividad", "Atención al detalle"],
    "keywords": ["Figma", "Illustrator", "Photoshop", "HTML/CSS"],
    "anos_experiencia": 3,
    "ubicacion": "Ñuñoa, Santiago",
    "experiencia": [
      {"cargo": "UI Designer", "empresa": "Agencia Creativa Norte", "fecha_inicio": "2021-08", "fecha_fin": null, "descripcion": "Interfaces web y mobile"}
    ],
    "educacion": [],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 1600,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '2 days 22 hours',
  62,
  NOW() - INTERVAL '3 days'
),
(
  'cccccccc-0203-0203-0203-000000000008',
  'bbbbbbbb-2222-2222-2222-000000000002',
  'Fernanda Díaz',
  'fernanda.diaz.ux@outlook.com',
  'test/cvs/fernanda-diaz-cv.pdf',
  '190.160.22.77',
  ARRAY['UX Research', 'Figma', 'Usability Testing', 'Wireframing'],
  ARRAY['UX Research', 'Figma', 'Usability Testing', 'Wireframing'],
  '{
    "nombre_completo": "Fernanda Díaz",
    "email": "fernanda.diaz.ux@outlook.com",
    "telefono": "+56 9 2211 3344",
    "titulo_profesional": "UX Researcher",
    "resumen": "Investigadora UX con foco en pruebas de usabilidad y wireframing. 4 años en banca digital.",
    "skills_tecnicas": ["UX Research", "Figma", "Usability Testing", "Wireframing", "Maze"],
    "skills_blandas": ["Escucha activa", "Síntesis de hallazgos"],
    "keywords": ["UX Research", "Figma", "Usability Testing", "Wireframing"],
    "anos_experiencia": 4,
    "ubicacion": "Vitacura, Santiago",
    "experiencia": [
      {"cargo": "UX Researcher", "empresa": "Banco Retail", "fecha_inicio": "2020-02", "fecha_fin": null, "descripcion": "Estudios de usabilidad"}
    ],
    "educacion": [
      {"institucion": "UAI", "titulo": "Psicología", "fecha": "2018", "descripcion": "Diplomado UX"}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Intermedio"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 2200,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '23 hours',
  74,
  NOW() - INTERVAL '1 day'
),

-- ---------- Oferta 3: Analista de Datos ----------
(
  'cccccccc-0301-0301-0301-000000000009',
  'bbbbbbbb-3333-3333-3333-000000000003',
  'Ignacio Vega',
  'ignacio.vega.data@gmail.com',
  'test/cvs/ignacio-vega-cv.pdf',
  '200.75.44.11',
  ARRAY['Python', 'SQL', 'Tableau', 'Machine Learning', 'Pandas'],
  ARRAY['Python', 'SQL', 'Tableau', 'Machine Learning', 'Pandas'],
  '{
    "nombre_completo": "Ignacio Vega",
    "email": "ignacio.vega.data@gmail.com",
    "telefono": "+56 9 8877 6655",
    "titulo_profesional": "Data Analyst",
    "resumen": "Analista de datos con 4 años. Python, SQL avanzado, Tableau y modelos ML básicos.",
    "skills_tecnicas": ["Python", "SQL", "Tableau", "Pandas", "scikit-learn"],
    "skills_blandas": ["Pensamiento analítico", "Storytelling con datos"],
    "keywords": ["Python", "SQL", "Tableau", "Machine Learning", "Pandas"],
    "anos_experiencia": 4,
    "ubicacion": "Santiago, Chile",
    "experiencia": [
      {"cargo": "Data Analyst", "empresa": "Retail CL", "fecha_inicio": "2020-06", "fecha_fin": null, "descripcion": "Dashboards y forecasting"}
    ],
    "educacion": [
      {"institucion": "USACH", "titulo": "Ingeniería Estadística", "fecha": "2019", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Intermedio"}],
    "parse_method": "llm",
    "used_ocr": false,
    "raw_text_length": 3500,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '19 days',
  85,
  NOW() - INTERVAL '20 days'
),
(
  'cccccccc-0302-0302-0302-000000000010',
  'bbbbbbbb-3333-3333-3333-000000000003',
  'Paula Herrera',
  'paula.herrera.bi@gmail.com',
  'test/cvs/paula-herrera-cv.pdf',
  '190.160.55.22',
  ARRAY['SQL', 'Power BI', 'Excel', 'R', 'Estadística'],
  ARRAY['SQL', 'Power BI', 'Excel', 'R', 'Estadística'],
  '{
    "nombre_completo": "Paula Herrera",
    "email": "paula.herrera.bi@gmail.com",
    "telefono": "+56 9 1122 3344",
    "titulo_profesional": "Analista BI",
    "resumen": "Analista de business intelligence con Power BI, SQL y R. Fuerte en reporting ejecutivo.",
    "skills_tecnicas": ["SQL", "Power BI", "Excel", "R", "DAX"],
    "skills_blandas": ["Organización", "Comunicación con stakeholders"],
    "keywords": ["SQL", "Power BI", "Excel", "R", "Estadística"],
    "anos_experiencia": 3,
    "ubicacion": "La Florida, Santiago",
    "experiencia": [
      {"cargo": "Analista BI", "empresa": "Seguros Andes", "fecha_inicio": "2021-03", "fecha_fin": null, "descripcion": "Reportes Power BI"}
    ],
    "educacion": [],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 2100,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '9 days',
  70,
  NOW() - INTERVAL '10 days'
),

-- ---------- Oferta 4: Ejecutivo de Ventas ----------
(
  'cccccccc-0401-0401-0401-000000000011',
  'bbbbbbbb-4444-4444-4444-000000000004',
  'Andrés Molina',
  'andres.molina.ventas@gmail.com',
  'test/cvs/andres-molina-cv.pdf',
  '201.238.77.33',
  ARRAY['Ventas B2B', 'HubSpot', 'Negociación', 'SaaS', 'CRM'],
  ARRAY['Ventas B2B', 'HubSpot', 'Negociación', 'SaaS', 'CRM'],
  '{
    "nombre_completo": "Andrés Molina",
    "email": "andres.molina.ventas@gmail.com",
    "telefono": "+56 9 7777 8888",
    "titulo_profesional": "Ejecutivo de Ventas B2B",
    "resumen": "Vendedor consultivo B2B con 5 años en SaaS. Experto en HubSpot y cierre de deals enterprise.",
    "skills_tecnicas": ["HubSpot", "CRM", "LinkedIn Sales Navigator", "Excel"],
    "skills_blandas": ["Negociación", "Persuasión", "Resiliencia"],
    "keywords": ["Ventas B2B", "HubSpot", "Negociación", "SaaS", "CRM"],
    "anos_experiencia": 5,
    "ubicacion": "Santiago, Chile",
    "experiencia": [
      {"cargo": "Account Executive", "empresa": "SaaS LatAm", "fecha_inicio": "2019-01", "fecha_fin": null, "descripcion": "Cuota anual superada 3 años"}
    ],
    "educacion": [
      {"institucion": "Universidad Mayor", "titulo": "Ingeniería Comercial", "fecha": "2017", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Avanzado"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 2700,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '11 hours',
  91,
  NOW() - INTERVAL '12 hours'
),
(
  'cccccccc-0402-0402-0402-000000000012',
  'bbbbbbbb-4444-4444-4444-000000000004',
  'Karla Soto',
  'karla.soto@hotmail.com',
  'test/cvs/karla-soto-cv.pdf',
  '179.58.100.55',
  ARRAY['Ventas', 'Salesforce', 'Telemarketing'],
  ARRAY['Ventas', 'Salesforce', 'Telemarketing'],
  '{
    "nombre_completo": "Karla Soto",
    "email": "karla.soto@hotmail.com",
    "telefono": "+56 9 4455 6677",
    "titulo_profesional": "Ejecutiva de Ventas",
    "resumen": "Experiencia en telemarketing y Salesforce. Busca migrar a ventas B2B de software.",
    "skills_tecnicas": ["Salesforce", "Telemarketing", "Excel"],
    "skills_blandas": ["Orientación a metas"],
    "keywords": ["Ventas", "Salesforce", "Telemarketing"],
    "anos_experiencia": 2,
    "ubicacion": "Puente Alto, Santiago",
    "experiencia": [
      {"cargo": "Ejecutiva call center", "empresa": "Telecom CL", "fecha_inicio": "2022-01", "fecha_fin": null, "descripcion": "Ventas outbound"}
    ],
    "educacion": [],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 1200,
    "warnings": ["CV corto"]
  }'::jsonb,
  'success',
  NOW() - INTERVAL '7 hours',
  42,
  NOW() - INTERVAL '8 hours'
),
(
  'cccccccc-0403-0403-0403-000000000013',
  'bbbbbbbb-4444-4444-4444-000000000004',
  'Felipe Ramos',
  'felipe.ramos.exec@gmail.com',
  'test/cvs/felipe-ramos-cv.pdf',
  '200.104.88.66',
  ARRAY['Ventas consultivas', 'ERP', 'B2B', 'Inglés', 'LinkedIn Sales Navigator'],
  ARRAY['Ventas consultivas', 'ERP', 'B2B', 'Inglés', 'LinkedIn Sales Navigator'],
  '{
    "nombre_completo": "Felipe Ramos",
    "email": "felipe.ramos.exec@gmail.com",
    "telefono": "+56 9 9090 8080",
    "titulo_profesional": "Ejecutivo de Cuentas Enterprise",
    "resumen": "Especialista en ventas consultivas de ERP y software B2B. Inglés fluido y prospección en LinkedIn.",
    "skills_tecnicas": ["ERP", "LinkedIn Sales Navigator", "CRM", "PowerPoint"],
    "skills_blandas": ["Negociación compleja", "Presentaciones ejecutivas"],
    "keywords": ["Ventas consultivas", "ERP", "B2B", "Inglés", "LinkedIn Sales Navigator"],
    "anos_experiencia": 7,
    "ubicacion": "Las Condes, Santiago",
    "experiencia": [
      {"cargo": "Enterprise AE", "empresa": "ERP Global", "fecha_inicio": "2018-05", "fecha_fin": null, "descripcion": "Cuentas >USD 100k"}
    ],
    "educacion": [
      {"institucion": "U. de los Andes", "titulo": "Ingeniería Comercial", "fecha": "2015", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "C1"}],
    "parse_method": "hybrid",
    "used_ocr": false,
    "raw_text_length": 3900,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '1 hour',
  80,
  NOW() - INTERVAL '2 hours'
),
(
  'cccccccc-0404-0404-0404-000000000014',
  'bbbbbbbb-4444-4444-4444-000000000004',
  NULL,
  'candidato.ventas@outlook.com',
  'test/cvs/candidato-ventas-cv.pdf',
  '179.58.200.99',
  ARRAY['Ventas', 'PYME', 'Retail'],
  ARRAY['Ventas', 'PYME', 'Retail'],
  '{
    "nombre_completo": null,
    "email": "candidato.ventas@outlook.com",
    "telefono": null,
    "titulo_profesional": null,
    "resumen": null,
    "skills_tecnicas": [],
    "skills_blandas": [],
    "keywords": ["Ventas", "PYME", "Retail"],
    "anos_experiencia": null,
    "ubicacion": null,
    "experiencia": [],
    "educacion": [],
    "idiomas": [],
    "parse_method": "rule",
    "used_ocr": true,
    "ocr_engine": "ocr_space",
    "raw_text_length": 200,
    "warnings": ["texto insuficiente", "fallo extracción estructurada"]
  }'::jsonb,
  'failed',
  NOW() - INTERVAL '25 minutes',
  25,
  NOW() - INTERVAL '30 minutes'
),

-- ---------- Oferta 6: Médico General ----------
(
  'cccccccc-0601-0601-0601-000000000015',
  'bbbbbbbb-6666-6666-6666-000000000006',
  'Dr. Roberto Alvarado',
  'roberto.alvarado.md@gmail.com',
  'test/cvs/roberto-alvarado-cv.pdf',
  '200.75.33.10',
  ARRAY['Medicina General', 'SIGFE', 'Atención Primaria', 'APS'],
  ARRAY['Medicina General', 'SIGFE', 'Atención Primaria', 'APS'],
  '{
    "nombre_completo": "Roberto Alvarado",
    "email": "roberto.alvarado.md@gmail.com",
    "telefono": "+56 9 6000 1111",
    "titulo_profesional": "Médico Cirujano",
    "resumen": "Médico general con 8 años en atención primaria. Experiencia en SIGFE y programas APS.",
    "skills_tecnicas": ["Medicina General", "SIGFE", "APS", "Ficha clínica electrónica"],
    "skills_blandas": ["Empatía", "Trabajo multidisciplinario"],
    "keywords": ["Medicina General", "SIGFE", "Atención Primaria", "APS"],
    "anos_experiencia": 8,
    "ubicacion": "Concepción, Chile",
    "experiencia": [
      {"cargo": "Médico APS", "empresa": "CESFAM Regional", "fecha_inicio": "2016-03", "fecha_fin": null, "descripcion": "Atención primaria y controles"}
    ],
    "educacion": [
      {"institucion": "Universidad de Concepción", "titulo": "Medicina", "fecha": "2015", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 3000,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '2 days 20 hours',
  87,
  NOW() - INTERVAL '3 days'
),
(
  'cccccccc-0602-0602-0602-000000000016',
  'bbbbbbbb-6666-6666-6666-000000000006',
  'Dra. Lorena Espinoza',
  'lorena.espinoza.dra@gmail.com',
  'test/cvs/lorena-espinoza-cv.pdf',
  '190.160.44.88',
  ARRAY['Medicina', 'Urgencias', 'Atención Primaria', 'Pediatría'],
  ARRAY['Medicina', 'Urgencias', 'Atención Primaria', 'Pediatría'],
  '{
    "nombre_completo": "Lorena Espinoza",
    "email": "lorena.espinoza.dra@gmail.com",
    "telefono": "+56 9 6222 3333",
    "titulo_profesional": "Médica General",
    "resumen": "Médica con experiencia en urgencias y pediatría ambulatoria. Interés en atención primaria.",
    "skills_tecnicas": ["Medicina", "Urgencias", "Pediatría", "Atención Primaria"],
    "skills_blandas": ["Manejo de crisis", "Comunicación con familias"],
    "keywords": ["Medicina", "Urgencias", "Atención Primaria", "Pediatría"],
    "anos_experiencia": 5,
    "ubicacion": "Talcahuano, Chile",
    "experiencia": [
      {"cargo": "Médica de urgencias", "empresa": "Hospital Regional", "fecha_inicio": "2019-01", "fecha_fin": null, "descripcion": "Turnos urgencias"}
    ],
    "educacion": [
      {"institucion": "U. de Chile", "titulo": "Medicina", "fecha": "2018", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Básico"}],
    "parse_method": "hybrid",
    "used_ocr": false,
    "raw_text_length": 2600,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '1 day 1 hour',
  68,
  NOW() - INTERVAL '1 day 2 hours'
),
(
  'cccccccc-0603-0603-0603-000000000017',
  'bbbbbbbb-6666-6666-6666-000000000006',
  'Dr. Carlos Muñoz',
  'carlos.munoz.medico@outlook.com',
  'test/cvs/carlos-munoz-cv.pdf',
  '201.238.55.33',
  ARRAY['Medicina General', 'Gestión Clínica', 'Epidemiología'],
  ARRAY['Medicina General', 'Gestión Clínica', 'Epidemiología'],
  NULL,
  'pending',
  NULL,
  NULL,
  NOW() - INTERVAL '6 hours'
),

-- ---------- Oferta 7: Enfermero/a Urgencias ----------
(
  'cccccccc-0701-0701-0701-000000000018',
  'bbbbbbbb-7777-7777-7777-000000000007',
  'Ana Martínez',
  'ana.martinez.enfermera@gmail.com',
  'test/cvs/ana-martinez-cv.pdf',
  '200.104.22.44',
  ARRAY['Enfermería', 'UCI', 'Urgencias', 'Reanimación'],
  ARRAY['Enfermería', 'UCI', 'Urgencias', 'Reanimación'],
  '{
    "nombre_completo": "Ana Martínez",
    "email": "ana.martinez.enfermera@gmail.com",
    "telefono": "+56 9 7001 2002",
    "titulo_profesional": "Enfermera Universitaria",
    "resumen": "Enfermera con 6 años en UCI y urgencias. Certificada en reanimación avanzada.",
    "skills_tecnicas": ["Enfermería", "UCI", "Urgencias", "Reanimación", "Vía venosa"],
    "skills_blandas": ["Trabajo bajo presión", "Liderazgo de turno"],
    "keywords": ["Enfermería", "UCI", "Urgencias", "Reanimación"],
    "anos_experiencia": 6,
    "ubicacion": "Viña del Mar, Chile",
    "experiencia": [
      {"cargo": "Enfermera UCI", "empresa": "Clínica Costa", "fecha_inicio": "2018-04", "fecha_fin": null, "descripcion": "UCI adulto y urgencias"}
    ],
    "educacion": [
      {"institucion": "PUCV", "titulo": "Enfermería", "fecha": "2017", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 2400,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '22 hours',
  89,
  NOW() - INTERVAL '1 day'
),
(
  'cccccccc-0702-0702-0702-000000000019',
  'bbbbbbbb-7777-7777-7777-000000000007',
  'José Contreras',
  'jose.contreras.enf@outlook.com',
  'test/cvs/jose-contreras-cv.pdf',
  '179.58.88.22',
  ARRAY['Enfermería', 'Urgencias', 'ACLS', 'Turno noche'],
  ARRAY['Enfermería', 'Urgencias', 'ACLS', 'Turno noche'],
  '{
    "nombre_completo": "José Contreras",
    "email": "jose.contreras.enf@outlook.com",
    "telefono": "+56 9 8111 9222",
    "titulo_profesional": "Enfermero",
    "resumen": "Enfermero de urgencias con ACLS y preferencia por turno noche. 3 años de experiencia.",
    "skills_tecnicas": ["Enfermería", "Urgencias", "ACLS", "Triaje"],
    "skills_blandas": ["Puntualidad", "Trabajo en equipo"],
    "keywords": ["Enfermería", "Urgencias", "ACLS", "Turno noche"],
    "anos_experiencia": 3,
    "ubicacion": "Valparaíso, Chile",
    "experiencia": [
      {"cargo": "Enfermero urgencias", "empresa": "SAPU Comunal", "fecha_inicio": "2021-07", "fecha_fin": null, "descripcion": "Turnos 12h"}
    ],
    "educacion": [],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 1800,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '4 hours',
  76,
  NOW() - INTERVAL '5 hours'
),
(
  'cccccccc-0703-0703-0703-000000000020',
  'bbbbbbbb-7777-7777-7777-000000000007',
  'Marcela Ríos',
  'marcela.rios.eu@gmail.com',
  'test/cvs/marcela-rios-cv.pdf',
  '190.160.99.55',
  ARRAY['Enfermería', 'Urgencias', 'Triaje', 'Pediátrica'],
  ARRAY['Enfermería', 'Urgencias', 'Triaje', 'Pediátrica'],
  '{
    "nombre_completo": "Marcela Ríos",
    "email": "marcela.rios.eu@gmail.com",
    "telefono": "+56 9 6333 7444",
    "titulo_profesional": "Enfermera Pediátrica",
    "resumen": "Enfermera con foco en urgencias pediátricas y triaje. 4 años en servicio de pediatría.",
    "skills_tecnicas": ["Enfermería", "Urgencias", "Triaje", "Pediátrica"],
    "skills_blandas": ["Empatía con niños y familias"],
    "keywords": ["Enfermería", "Urgencias", "Triaje", "Pediátrica"],
    "anos_experiencia": 4,
    "ubicacion": "Viña del Mar, Chile",
    "experiencia": [
      {"cargo": "Enfermera pediatría", "empresa": "Hospital Infantil", "fecha_inicio": "2020-02", "fecha_fin": null, "descripcion": "Urgencias pediátricas"}
    ],
    "educacion": [
      {"institucion": "UV", "titulo": "Enfermería", "fecha": "2019", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "llm",
    "used_ocr": false,
    "raw_text_length": 2300,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '1 hour 30 minutes',
  71,
  NOW() - INTERVAL '2 hours'
),

-- ---------- Oferta 9: Administrativo Clínica ----------
(
  'cccccccc-0901-0901-0901-000000000021',
  'bbbbbbbb-9999-9999-9999-000000000009',
  'María Pérez',
  'maria.perez.admin@gmail.com',
  'test/cvs/maria-perez-cv.pdf',
  '200.75.11.22',
  ARRAY['Recepción', 'Facturación', 'ISAPRE', 'FONASA', 'Office'],
  ARRAY['Recepción', 'Facturación', 'ISAPRE', 'FONASA', 'Office'],
  '{
    "nombre_completo": "María Pérez",
    "email": "maria.perez.admin@gmail.com",
    "telefono": "+56 9 5000 6000",
    "titulo_profesional": "Administrativa de Clínica",
    "resumen": "5 años en recepción clínica. Experta en facturación ISAPRE/FONASA y agenda de pacientes.",
    "skills_tecnicas": ["Recepción", "Facturación", "ISAPRE", "FONASA", "Excel", "Word"],
    "skills_blandas": ["Atención al cliente", "Organización"],
    "keywords": ["Recepción", "Facturación", "ISAPRE", "FONASA", "Office"],
    "anos_experiencia": 5,
    "ubicacion": "Ñuñoa, Santiago",
    "experiencia": [
      {"cargo": "Recepcionista clínica", "empresa": "Centro Médico Oriente", "fecha_inicio": "2019-01", "fecha_fin": null, "descripcion": "Agenda y facturación"}
    ],
    "educacion": [
      {"institucion": "INACAP", "titulo": "Administración de Empresas", "fecha": "2018", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 2000,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '3 days 20 hours',
  84,
  NOW() - INTERVAL '4 days'
),
(
  'cccccccc-0902-0902-0902-000000000022',
  'bbbbbbbb-9999-9999-9999-000000000009',
  'Jorge Salinas',
  'jorge.salinas.recep@hotmail.com',
  'test/cvs/jorge-salinas-cv.pdf',
  '201.238.33.66',
  ARRAY['Atención al cliente', 'Office', 'Secretariado'],
  ARRAY['Atención al cliente', 'Office', 'Secretariado'],
  '{
    "nombre_completo": "Jorge Salinas",
    "email": "jorge.salinas.recep@hotmail.com",
    "telefono": "+56 9 4111 5222",
    "titulo_profesional": "Asistente Administrativo",
    "resumen": "Experiencia en atención al cliente y secretariado. Manejo intermedio de Office.",
    "skills_tecnicas": ["Office", "Secretariado", "Atención al cliente"],
    "skills_blandas": ["Amabilidad", "Puntualidad"],
    "keywords": ["Atención al cliente", "Office", "Secretariado"],
    "anos_experiencia": 2,
    "ubicacion": "Santiago, Chile",
    "experiencia": [
      {"cargo": "Recepcionista", "empresa": "Oficina contable", "fecha_inicio": "2022-06", "fecha_fin": null, "descripcion": "Recepción y agenda"}
    ],
    "educacion": [],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 1100,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '1 day 22 hours',
  48,
  NOW() - INTERVAL '2 days'
),
(
  'cccccccc-0903-0903-0903-000000000023',
  'bbbbbbbb-9999-9999-9999-000000000009',
  'Daniela Vásquez',
  'daniela.vasquez.cl@gmail.com',
  'test/cvs/daniela-vasquez-cv.pdf',
  '190.160.77.33',
  ARRAY['Recepción', 'Gestión clínica', 'Excel', 'Atención al paciente'],
  ARRAY['Recepción', 'Gestión clínica', 'Excel', 'Atención al paciente'],
  '{
    "nombre_completo": "Daniela Vásquez",
    "email": "daniela.vasquez.cl@gmail.com",
    "telefono": "+56 9 3003 4004",
    "titulo_profesional": "Coordinadora de Admisión",
    "resumen": "3 años en gestión clínica y recepción. Excel avanzado y fuerte orientación al paciente.",
    "skills_tecnicas": ["Recepción", "Gestión clínica", "Excel", "Agenda médica"],
    "skills_blandas": ["Empatía", "Multitasking"],
    "keywords": ["Recepción", "Gestión clínica", "Excel", "Atención al paciente"],
    "anos_experiencia": 3,
    "ubicacion": "Macul, Santiago",
    "experiencia": [
      {"cargo": "Admisión", "empresa": "Clínica Familiar", "fecha_inicio": "2021-02", "fecha_fin": null, "descripcion": "Admisión y coordinación"}
    ],
    "educacion": [
      {"institucion": "DUOC", "titulo": "Administración", "fecha": "2020", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 1900,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '1 day 9 hours',
  73,
  NOW() - INTERVAL '1 day 10 hours'
),
(
  'cccccccc-0904-0904-0904-000000000024',
  'bbbbbbbb-9999-9999-9999-000000000009',
  NULL,
  'postulante.anonimo2@gmail.com',
  'test/cvs/postulante-anonimo-admin-cv.pdf',
  '179.58.44.11',
  ARRAY['Administración', 'Salud'],
  ARRAY['Administración', 'Salud'],
  '{
    "nombre_completo": null,
    "email": "postulante.anonimo2@gmail.com",
    "telefono": null,
    "titulo_profesional": "Administrativo",
    "resumen": "Experiencia general en administración en sector salud.",
    "skills_tecnicas": ["Administración"],
    "skills_blandas": [],
    "keywords": ["Administración", "Salud"],
    "anos_experiencia": 1,
    "ubicacion": "Santiago, Chile",
    "experiencia": [],
    "educacion": [],
    "idiomas": [],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 800,
    "warnings": ["nombre no detectado"]
  }'::jsonb,
  'success',
  NOW() - INTERVAL '2 hours',
  35,
  NOW() - INTERVAL '3 hours'
),

-- ---------- Oferta nueva A: Marketing Digital ----------
(
  'cccccccc-0a01-0a01-0a01-000000000025',
  'bbbbbbbb-aaaa-aaaa-aaaa-00000000000a',
  'Catalina Bravo',
  'catalina.bravo.mkt@gmail.com',
  'test/cvs/catalina-bravo-cv.pdf',
  '190.160.10.20',
  ARRAY['Google Ads', 'Meta Ads', 'SEO', 'GA4', 'HubSpot'],
  ARRAY['Google Ads', 'Meta Ads', 'SEO', 'GA4', 'HubSpot'],
  '{
    "nombre_completo": "Catalina Bravo",
    "email": "catalina.bravo.mkt@gmail.com",
    "telefono": "+56 9 9123 4567",
    "titulo_profesional": "Especialista en Marketing Digital",
    "resumen": "Performance marketer con 4 años en B2B SaaS. Google Ads, Meta y HubSpot; fuerte en CRO y reporting GA4.",
    "skills_tecnicas": ["Google Ads", "Meta Ads", "SEO", "GA4", "HubSpot", "Looker Studio"],
    "skills_blandas": ["Orientación a resultados", "Coordinación cross-funcional"],
    "keywords": ["Google Ads", "Meta Ads", "SEO", "GA4", "HubSpot"],
    "anos_experiencia": 4,
    "ubicacion": "Vitacura, Santiago",
    "experiencia": [
      {"cargo": "Performance Lead", "empresa": "Growth Agency CL", "fecha_inicio": "2021-01", "fecha_fin": null, "descripcion": "Campañas B2B LatAm"}
    ],
    "educacion": [
      {"institucion": "UAI", "titulo": "Publicidad", "fecha": "2019", "descripcion": "Cert. Google Ads"}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Intermedio"}],
    "parse_method": "hybrid",
    "used_ocr": false,
    "raw_text_length": 3100,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '2 hours',
  88,
  NOW() - INTERVAL '2 hours 30 minutes'
),
(
  'cccccccc-0a02-0a02-0a02-000000000026',
  'bbbbbbbb-aaaa-aaaa-aaaa-00000000000a',
  'Tomás Vidal',
  'tomas.vidal.seo@outlook.com',
  'test/cvs/tomas-vidal-cv.pdf',
  '201.238.20.30',
  ARRAY['SEO', 'Content Marketing', 'Copywriting', 'Semrush'],
  ARRAY['SEO', 'Content Marketing', 'Copywriting', 'Semrush'],
  '{
    "nombre_completo": "Tomás Vidal",
    "email": "tomas.vidal.seo@outlook.com",
    "telefono": "+56 9 8234 5678",
    "titulo_profesional": "SEO & Content Specialist",
    "resumen": "Especialista SEO y contenidos con 3 años. Semrush, on-page y content marketing para leads orgánicos.",
    "skills_tecnicas": ["SEO", "Semrush", "Content Marketing", "Copywriting", "WordPress"],
    "skills_blandas": ["Creatividad", "Autonomía"],
    "keywords": ["SEO", "Content Marketing", "Copywriting", "Semrush"],
    "anos_experiencia": 3,
    "ubicacion": "Providencia, Santiago",
    "experiencia": [
      {"cargo": "SEO Specialist", "empresa": "E-commerce Fashion", "fecha_inicio": "2021-09", "fecha_fin": null, "descripcion": "Tráfico orgánico +40% YoY"}
    ],
    "educacion": [],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Avanzado"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 2400,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '1 hour',
  61,
  NOW() - INTERVAL '1 hour 15 minutes'
),

-- ---------- Oferta nueva B: Profesor/a particular ----------
(
  'cccccccc-0b01-0b01-0b01-000000000027',
  'bbbbbbbb-bbbb-bbbb-bbbb-00000000000b',
  'Laura Campos',
  'laura.campos.profe@gmail.com',
  'test/cvs/laura-campos-cv.pdf',
  '190.160.40.50',
  ARRAY['Pedagogía', 'Biología', 'Química', 'MINEDUC', 'Clases particulares'],
  ARRAY['Pedagogía', 'Biología', 'Química', 'MINEDUC', 'Clases particulares'],
  '{
    "nombre_completo": "Laura Campos",
    "email": "laura.campos.profe@gmail.com",
    "telefono": "+56 9 7345 6789",
    "titulo_profesional": "Profesora de Biología y Química",
    "resumen": "Pedagoga en Ciencias Naturales con 5 años dando clases particulares y refuerzo PAES. Curriculum MINEDUC.",
    "skills_tecnicas": ["Pedagogía", "Biología", "Química", "Planificación curricular"],
    "skills_blandas": ["Paciencia", "Motivación de estudiantes"],
    "keywords": ["Pedagogía", "Biología", "Química", "MINEDUC", "Clases particulares"],
    "anos_experiencia": 5,
    "ubicacion": "Providencia, Santiago",
    "experiencia": [
      {"cargo": "Profesora particular", "empresa": "Independiente", "fecha_inicio": "2019-03", "fecha_fin": null, "descripcion": "Refuerzo media y preuniversitario"},
      {"cargo": "Docente media", "empresa": "Colegio San Patricio", "fecha_inicio": "2018-03", "fecha_fin": "2022-12", "descripcion": "Biología 1°–4° medio"}
    ],
    "educacion": [
      {"institucion": "UMCE", "titulo": "Pedagogía en Biología y Química", "fecha": "2017", "descripcion": null}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}],
    "parse_method": "rule",
    "used_ocr": false,
    "raw_text_length": 2800,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '5 hours',
  86,
  NOW() - INTERVAL '6 hours'
),

-- ---------- Oferta nueva C: Abogado/a Junior Freelance ----------
(
  'cccccccc-0c01-0c01-0c01-000000000028',
  'bbbbbbbb-cccc-cccc-cccc-00000000000c',
  'Nicolás Araya',
  'nicolas.araya.abog@gmail.com',
  'test/cvs/nicolas-araya-cv.pdf',
  '200.75.60.70',
  ARRAY['Derecho comercial', 'Contratos', 'Protección de datos', 'SaaS', 'Compliance'],
  ARRAY['Derecho comercial', 'Contratos', 'Protección de datos', 'SaaS', 'Compliance'],
  '{
    "nombre_completo": "Nicolás Araya",
    "email": "nicolas.araya.abog@gmail.com",
    "telefono": "+56 9 6456 7890",
    "titulo_profesional": "Abogado Junior",
    "resumen": "Abogado con 2 años en derecho comercial y contratos tech. Interés en privacidad (Ley 19.628) y compliance SaaS.",
    "skills_tecnicas": ["Contratos", "Derecho comercial", "Protección de datos", "Word", "Compliance"],
    "skills_blandas": ["Análisis crítico", "Redacción clara"],
    "keywords": ["Derecho comercial", "Contratos", "Protección de datos", "SaaS", "Compliance"],
    "anos_experiencia": 2,
    "ubicacion": "Las Condes, Santiago",
    "experiencia": [
      {"cargo": "Abogado asociado junior", "empresa": "Estudio Jurídico Andino", "fecha_inicio": "2022-08", "fecha_fin": null, "descripcion": "Revisión de contratos comerciales"}
    ],
    "educacion": [
      {"institucion": "Universidad de Chile", "titulo": "Derecho", "fecha": "2022", "descripcion": "Juramento 2022"}
    ],
    "idiomas": [{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Intermedio-alto"}],
    "parse_method": "hybrid",
    "used_ocr": false,
    "raw_text_length": 2600,
    "warnings": []
  }'::jsonb,
  'success',
  NOW() - INTERVAL '30 minutes',
  79,
  NOW() - INTERVAL '45 minutes'
)

ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================
-- RESUMEN DE DATOS CREADOS
-- ============================================================
SELECT 'Empleadores' AS tabla, COUNT(*) AS total FROM public.empleadores WHERE id IN (
  'aaaaaaaa-1111-1111-1111-000000000001',
  'aaaaaaaa-2222-2222-2222-000000000002'
)
UNION ALL
SELECT 'Ofertas', COUNT(*) FROM public.ofertas WHERE empleador_id IN (
  'aaaaaaaa-1111-1111-1111-000000000001',
  'aaaaaaaa-2222-2222-2222-000000000002'
)
UNION ALL
SELECT 'Postulaciones', COUNT(*) FROM public.postulaciones WHERE oferta_id::text LIKE 'bbbbbbbb-%'
UNION ALL
SELECT 'Postulaciones success', COUNT(*) FROM public.postulaciones
  WHERE oferta_id::text LIKE 'bbbbbbbb-%' AND parse_status = 'success'
UNION ALL
SELECT 'Postulaciones pending', COUNT(*) FROM public.postulaciones
  WHERE oferta_id::text LIKE 'bbbbbbbb-%' AND parse_status = 'pending'
UNION ALL
SELECT 'Postulaciones failed', COUNT(*) FROM public.postulaciones
  WHERE oferta_id::text LIKE 'bbbbbbbb-%' AND parse_status = 'failed';
