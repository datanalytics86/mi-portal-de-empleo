/** DDL idempotente para escrituras (enlist / postulaciones). Misma forma que bootstrap-neon.mjs. */
export const WRITE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS public.empleadores (
  id         UUID PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  empresa    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ofertas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       TEXT NOT NULL,
  descripcion  TEXT NOT NULL,
  empresa      TEXT NOT NULL,
  tipo_empleo  TEXT NOT NULL CHECK (tipo_empleo IN ('full-time', 'part-time', 'freelance', 'practica')),
  categoria    TEXT NOT NULL,
  comuna       TEXT NOT NULL,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  activa       BOOLEAN NOT NULL DEFAULT TRUE,
  expira_en    TIMESTAMPTZ NOT NULL,
  empleador_id UUID NOT NULL REFERENCES public.empleadores(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_demo      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ofertas_activa_expira ON public.ofertas (activa, expira_en);
CREATE INDEX IF NOT EXISTS idx_ofertas_empleador ON public.ofertas (empleador_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_tipo ON public.ofertas (tipo_empleo);
CREATE INDEX IF NOT EXISTS idx_ofertas_is_demo ON public.ofertas (is_demo);
CREATE INDEX IF NOT EXISTS idx_ofertas_created ON public.ofertas (created_at DESC);

CREATE TABLE IF NOT EXISTS public.postulaciones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id      UUID NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
  nombre         TEXT,
  email          TEXT,
  cv_url         TEXT NOT NULL,
  ip_address     TEXT,
  palabras_clave TEXT[] DEFAULT '{}',
  keywords       TEXT[] DEFAULT '{}',
  cv_parsed      JSONB,
  parse_status   TEXT DEFAULT 'pending'
                   CHECK (parse_status IS NULL OR parse_status IN ('pending', 'success', 'failed', 'skipped')),
  parsed_at      TIMESTAMPTZ,
  match_score    SMALLINT CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100)),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_postulaciones_oferta ON public.postulaciones (oferta_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_created ON public.postulaciones (created_at);
CREATE INDEX IF NOT EXISTS idx_postulaciones_parse_status ON public.postulaciones (parse_status);

CREATE TABLE IF NOT EXISTS public.perfiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.ofertas ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
`;
