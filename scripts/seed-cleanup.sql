-- ============================================================
-- LIMPIEZA DE DATOS DE PRUEBA — Portal de Empleos Chile
-- ============================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Elimina TODOS los datos insertados por seed.sql
-- (incluye ofertas nuevas aaaa/bbbb/cccc y postulaciones 0a/0b/0c)
--
-- Orden: postulaciones → ofertas → empleadores → identities → users
-- (respeta FKs: postulaciones → ofertas → empleadores)
-- ============================================================

BEGIN;

-- 1. Eliminar postulaciones de prueba (UUID cast a text para LIKE)
DELETE FROM public.postulaciones
WHERE id::text LIKE 'cccccccc-%';

-- 2. Eliminar ofertas de prueba (incluye bbbbbbbb-aaaa/bbbb/cccc-...)
DELETE FROM public.ofertas
WHERE id::text LIKE 'bbbbbbbb-%';

-- 3. Eliminar empleadores de prueba
DELETE FROM public.empleadores
WHERE id IN (
  'aaaaaaaa-1111-1111-1111-000000000001',
  'aaaaaaaa-2222-2222-2222-000000000002'
);

-- 4. Eliminar identidades de auth
DELETE FROM auth.identities
WHERE user_id IN (
  'aaaaaaaa-1111-1111-1111-000000000001',
  'aaaaaaaa-2222-2222-2222-000000000002'
);

-- 5. Eliminar usuarios de auth
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
WHERE id::text LIKE 'bbbbbbbb-%'
UNION ALL
SELECT 'Postulaciones restantes', COUNT(*)
FROM public.postulaciones
WHERE id::text LIKE 'cccccccc-%';
