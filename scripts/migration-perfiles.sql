-- Enlistado de candidatos sin oferta específica.
-- Correr en Supabase SQL Editor ANTES de usar POST /api/enlist en producción.
-- Idempotente. No toca postulaciones ni ofertas.

CREATE TABLE IF NOT EXISTS public.perfiles (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre         TEXT,
  email          TEXT,
  cv_url         TEXT NOT NULL,
  ip_address     TEXT,
  keywords       TEXT[] DEFAULT '{}',
  cv_parsed      JSONB,
  parse_status   TEXT DEFAULT 'pending'
                   CHECK (parse_status IS NULL OR parse_status IN ('pending', 'success', 'failed', 'skipped')),
  parsed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfiles_created ON public.perfiles (created_at);
CREATE INDEX IF NOT EXISTS idx_perfiles_parse_status ON public.perfiles (parse_status);
CREATE INDEX IF NOT EXISTS idx_perfiles_email ON public.perfiles (email);

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'perfiles' AND policyname = 'perfiles_service_insert'
  ) THEN
    CREATE POLICY "perfiles_service_insert" ON public.perfiles
      FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

COMMENT ON TABLE public.perfiles IS
  'Pool de CVs enlistados sin oferta_id. Parsing en background. Borrar a los 90 días.';
