-- ============================================================
-- LIMPIEZA DE DATOS DE PRUEBA — Portal de Empleos Chile
-- ============================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Elimina TODOS los datos insertados por seed.sql
-- ============================================================

BEGIN;

-- 1. Eliminar postulaciones de prueba
DELETE FROM public.postulaciones
WHERE id LIKE 'cccccccc-%';

-- 2. Eliminar ofertas de prueba
DELETE FROM public.ofertas
WHERE id LIKE 'bbbbbbbb-%';

-- 3. Eliminar empleadores de prueba
DELETE FROM public.empleadores
WHERE id IN (
  'aaaaaaaa-1111-1111-1111-000000000001',
  'aaaaaaaa-2222-2222-2222-000000000002'
);

-- 4. Eliminar usuarios de auth
DELETE FROM auth.users
WHERE id IN (
  'aaaaaaaa-1111-1111-1111-000000000001',
  'aaaaaaaa-2222-2222-2222-000000000002'
);

COMMIT;

-- Verificar que no quede nada
SELECT 'Empleadores restantes' AS check, COUNT(*) AS total
FROM public.empleadores
WHERE id IN (
  'aaaaaaaa-1111-1111-1111-000000000001',
  'aaaaaaaa-2222-2222-2222-000000000002'
)
UNION ALL
SELECT 'Ofertas restantes', COUNT(*)
FROM public.ofertas
WHERE id LIKE 'bbbbbbbb-%'
UNION ALL
SELECT 'Postulaciones restantes', COUNT(*)
FROM public.postulaciones
WHERE id LIKE 'cccccccc-%';
