-- Fixture QA 410: oferta expirada con ID estable.
-- No reescribe las 1100 demo. Requiere el empleador demo
-- (eeeeeeee-0000-4000-8000-000000000000) de seed-demo-1000 / bootstrap-neon.
-- Cómo: SQL Editor o `psql $DATABASE_URL -f scripts/seed-expired-fixture.sql`

INSERT INTO public.ofertas (
  id, titulo, descripcion, empresa, tipo_empleo, categoria,
  comuna, lat, lng, activa, expira_en, empleador_id, created_at, is_demo
) VALUES (
  'eeeeeeee-0000-4000-8000-00000000e410',
  'Fixture QA 410 — oferta expirada',
  'Oferta de demostración ya cerrada. Sirve para verificar HTTP 410 en /oferta/{id}. No postular.',
  'Portal Demo Chile',
  'full-time',
  'Otro',
  'Santiago',
  -33.4569,
  -70.6483,
  TRUE,
  NOW() - INTERVAL '7 days',
  'eeeeeeee-0000-4000-8000-000000000000',
  NOW() - INTERVAL '30 days',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  activa = TRUE,
  expira_en = NOW() - INTERVAL '7 days',
  is_demo = TRUE;
