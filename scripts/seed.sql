-- ============================================================
-- SEED DE DATOS DE PRUEBA — Portal de Empleos Chile
-- ============================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Contraseña de ambas cuentas de prueba: TestPass123!
--
-- Cuentas creadas:
--   Empleador 1: test-empresa1@test.cl  (TechCorp Chile)
--   Empleador 2: test-empresa2@test.cl  (Salud Conecta)
--
-- Para eliminar todos los datos de prueba, ejecutar seed-cleanup.sql
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
-- 2. CREAR REGISTROS EN public.empleadores
-- ============================================================

INSERT INTO public.empleadores (id, email, empresa, created_at)
VALUES
  ('aaaaaaaa-1111-1111-1111-000000000001', 'test-empresa1@test.cl', 'TechCorp Chile', NOW()),
  ('aaaaaaaa-2222-2222-2222-000000000002', 'test-empresa2@test.cl', 'Salud Conecta',  NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. CREAR OFERTAS
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
  'Ofrecemos práctica profesional para estudiantes de Ingeniería en Computación o carreas afines. Aprenderás con un equipo senior en proyectos reales.

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
);

-- ============================================================
-- 4. CREAR POSTULACIONES (candidatos de prueba)
-- ============================================================

-- NOTA: cv_url apunta a rutas ficticias en el bucket 'cvs'.
-- En producción estas serían URLs firmadas de Supabase Storage.

INSERT INTO public.postulaciones (
  id, oferta_id, nombre, email, cv_url,
  ip_address, palabras_clave, created_at
) VALUES

-- Postulaciones para oferta 1 (Desarrollador Full Stack)
(
  'cccccccc-0101-0101-0101-000000000001',
  'bbbbbbbb-1111-1111-1111-000000000001',
  'Matías González',
  'matias.gonzalez@gmail.com',
  'test/cvs/matias-gonzalez-cv.pdf',
  '190.160.1.1',
  ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
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
  NOW() - INTERVAL '45 minutes'
),

-- Postulaciones para oferta 2 (Diseñador UX/UI)
(
  'cccccccc-0201-0201-0201-000000000006',
  'bbbbbbbb-2222-2222-2222-000000000002',
  'Sofía Mendoza',
  'sofia.ux@gmail.com',
  'test/cvs/sofia-mendoza-portfolio.pdf',
  '201.238.100.5',
  ARRAY['Figma', 'Adobe XD', 'Design System', 'User Research', 'Prototyping'],
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
  NOW() - INTERVAL '1 day'
),

-- Postulaciones para oferta 3 (Analista de Datos) — solo 2 candidatos
(
  'cccccccc-0301-0301-0301-000000000009',
  'bbbbbbbb-3333-3333-3333-000000000003',
  'Ignacio Vega',
  'ignacio.vega.data@gmail.com',
  'test/cvs/ignacio-vega-cv.pdf',
  '200.75.44.11',
  ARRAY['Python', 'SQL', 'Tableau', 'Machine Learning', 'Pandas'],
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
  NOW() - INTERVAL '10 days'
),

-- Postulaciones para oferta 4 (Ejecutivo Ventas) — 4 candidatos
(
  'cccccccc-0401-0401-0401-000000000011',
  'bbbbbbbb-4444-4444-4444-000000000004',
  'Andrés Molina',
  'andres.molina.ventas@gmail.com',
  'test/cvs/andres-molina-cv.pdf',
  '201.238.77.33',
  ARRAY['Ventas B2B', 'HubSpot', 'Negociación', 'SaaS', 'CRM'],
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
  NOW() - INTERVAL '30 minutes'
),

-- Postulaciones para oferta 6 (Médico General) — 3 candidatos
(
  'cccccccc-0601-0601-0601-000000000015',
  'bbbbbbbb-6666-6666-6666-000000000006',
  'Dr. Roberto Alvarado',
  'roberto.alvarado.md@gmail.com',
  'test/cvs/roberto-alvarado-cv.pdf',
  '200.75.33.10',
  ARRAY['Medicina General', 'SIGFE', 'Atención Primaria', 'APS'],
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
  NOW() - INTERVAL '6 hours'
),

-- Postulaciones para oferta 7 (Enfermero/a Urgencias) — 3 candidatos
(
  'cccccccc-0701-0701-0701-000000000018',
  'bbbbbbbb-7777-7777-7777-000000000007',
  'Ana Martínez',
  'ana.martinez.enfermera@gmail.com',
  'test/cvs/ana-martinez-cv.pdf',
  '200.104.22.44',
  ARRAY['Enfermería', 'UCI', 'Urgencias', 'Reanimación'],
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
  NOW() - INTERVAL '2 hours'
),

-- Postulaciones para oferta 9 (Administrativo Clínica) — 4 candidatos
(
  'cccccccc-0901-0901-0901-000000000021',
  'bbbbbbbb-9999-9999-9999-000000000009',
  'María Pérez',
  'maria.perez.admin@gmail.com',
  'test/cvs/maria-perez-cv.pdf',
  '200.75.11.22',
  ARRAY['Recepción', 'Facturación', 'ISAPRE', 'FONASA', 'Office'],
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
  NOW() - INTERVAL '3 hours'
);

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
SELECT 'Postulaciones', COUNT(*) FROM public.postulaciones WHERE oferta_id LIKE 'bbbbbbbb-%';
