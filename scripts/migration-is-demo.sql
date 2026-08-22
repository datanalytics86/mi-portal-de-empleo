-- Flag is_demo en ofertas. Idempotente.
-- Las ofertas ficticias del seed usan true; las reales quedan false.

ALTER TABLE public.ofertas
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ofertas_is_demo ON public.ofertas (is_demo);

COMMENT ON COLUMN public.ofertas.is_demo IS
  'true = oferta ficticia de demostración. No mostrar el flag al público.';
