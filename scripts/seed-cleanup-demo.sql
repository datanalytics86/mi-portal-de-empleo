-- Quita ofertas y empleador de demostración (is_demo = true).
-- No toca ofertas reales.

BEGIN;

DELETE FROM public.ofertas WHERE is_demo = TRUE;

DELETE FROM public.empleadores
WHERE id = 'eeeeeeee-0000-4000-8000-000000000000';

DELETE FROM auth.identities
WHERE user_id = 'eeeeeeee-0000-4000-8000-000000000000';

DELETE FROM auth.users
WHERE id = 'eeeeeeee-0000-4000-8000-000000000000';

COMMIT;
