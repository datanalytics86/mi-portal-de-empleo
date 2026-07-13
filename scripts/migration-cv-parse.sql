-- ============================================================
-- Migración: CV Parsing estructurado (Tier 1)
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Idempotente: seguro re-ejecutar
-- ============================================================

-- Columnas nuevas en postulaciones
ALTER TABLE public.postulaciones
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cv_parsed JSONB,
  ADD COLUMN IF NOT EXISTS parse_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS match_score SMALLINT;

-- Constraint de parse_status (drop + create para idempotencia)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'postulaciones_parse_status_check'
  ) THEN
    ALTER TABLE public.postulaciones
      ADD CONSTRAINT postulaciones_parse_status_check
      CHECK (parse_status IS NULL OR parse_status IN ('pending', 'success', 'failed', 'skipped'));
  END IF;
END $$;

-- match_score 0–100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'postulaciones_match_score_check'
  ) THEN
    ALTER TABLE public.postulaciones
      ADD CONSTRAINT postulaciones_match_score_check
      CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100));
  END IF;
END $$;

-- Backfill keywords desde palabras_clave legacy
UPDATE public.postulaciones
SET keywords = COALESCE(palabras_clave, '{}')
WHERE (keywords IS NULL OR keywords = '{}')
  AND palabras_clave IS NOT NULL
  AND cardinality(palabras_clave) > 0;

-- Filas antiguas sin parse → skipped (no re-procesamos en masa)
UPDATE public.postulaciones
SET parse_status = 'skipped'
WHERE parse_status IS NULL OR (
  parse_status = 'pending'
  AND cv_parsed IS NULL
  AND created_at < NOW() - INTERVAL '1 hour'
  AND (palabras_clave IS NULL OR cardinality(palabras_clave) = 0)
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_postulaciones_parse_status
  ON public.postulaciones (parse_status);

CREATE INDEX IF NOT EXISTS idx_postulaciones_match_score
  ON public.postulaciones (oferta_id, match_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_postulaciones_keywords_gin
  ON public.postulaciones USING GIN (keywords);

CREATE INDEX IF NOT EXISTS idx_postulaciones_cv_parsed_gin
  ON public.postulaciones USING GIN (cv_parsed jsonb_path_ops);

COMMENT ON COLUMN public.postulaciones.cv_parsed IS
  'Objeto estructurado del CV: nombre, skills, experiencia, etc.';
COMMENT ON COLUMN public.postulaciones.keywords IS
  'Keywords/skills para matching (canónico). palabras_clave se mantiene por retrocompat.';
COMMENT ON COLUMN public.postulaciones.parse_status IS
  'pending | success | failed | skipped';
COMMENT ON COLUMN public.postulaciones.match_score IS
  'Score 0-100 CV vs oferta (heurístico v1)';
