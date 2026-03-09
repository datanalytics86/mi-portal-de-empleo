-- ============================================================
-- Portal de Empleos Chile — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: empleadores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empleadores (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     TEXT NOT NULL UNIQUE,
  empresa   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.empleadores ENABLE ROW LEVEL SECURITY;

-- Un empleador solo puede ver y modificar sus propios datos
CREATE POLICY "empleador_select_own" ON public.empleadores
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "empleador_update_own" ON public.empleadores
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- TABLA: ofertas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ofertas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ofertas_updated_at
  BEFORE UPDATE ON public.ofertas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_ofertas_activa_expira ON public.ofertas (activa, expira_en);
CREATE INDEX IF NOT EXISTS idx_ofertas_empleador ON public.ofertas (empleador_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_tipo ON public.ofertas (tipo_empleo);

ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

-- Lectura pública de ofertas activas
CREATE POLICY "ofertas_public_select" ON public.ofertas
  FOR SELECT USING (activa = TRUE AND expira_en > NOW());

-- Empleadores ven todas sus ofertas (activas e inactivas)
CREATE POLICY "ofertas_empleador_select" ON public.ofertas
  FOR SELECT USING (auth.uid() = empleador_id);

-- Empleadores crean sus propias ofertas
CREATE POLICY "ofertas_empleador_insert" ON public.ofertas
  FOR INSERT WITH CHECK (auth.uid() = empleador_id);

-- Empleadores modifican solo sus ofertas
CREATE POLICY "ofertas_empleador_update" ON public.ofertas
  FOR UPDATE USING (auth.uid() = empleador_id);

-- ============================================================
-- TABLA: postulaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.postulaciones (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oferta_id      UUID NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
  nombre         TEXT,
  email          TEXT,
  cv_url         TEXT NOT NULL,
  ip_address     TEXT,
  palabras_clave TEXT[] DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_postulaciones_oferta ON public.postulaciones (oferta_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_created ON public.postulaciones (created_at);

ALTER TABLE public.postulaciones ENABLE ROW LEVEL SECURITY;

-- Solo el empleador dueño de la oferta puede ver las postulaciones
CREATE POLICY "postulaciones_empleador_select" ON public.postulaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ofertas
      WHERE ofertas.id = postulaciones.oferta_id
        AND ofertas.empleador_id = auth.uid()
    )
  );

-- Inserción pública (sin autenticación) para que candidatos puedan postular
-- La validación de datos se hace en el API route con service_role
CREATE POLICY "postulaciones_public_insert" ON public.postulaciones
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- STORAGE: bucket de CVs
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', FALSE)
ON CONFLICT DO NOTHING;

-- Solo se puede subir desde el servidor (service role)
-- No se necesita política de storage pública ya que usamos URLs firmadas

-- ============================================================
-- LIMPIEZA AUTOMÁTICA: eliminar datos > 90 días (cron job)
-- Configurar en Supabase Dashboard > Database > Extensions > pg_cron
-- ============================================================
-- SELECT cron.schedule(
--   'limpiar-datos-90-dias',
--   '0 3 * * *',  -- cada día a las 3am
--   $$
--     -- Eliminar CVs del storage
--     SELECT storage.delete_object('cvs', cv_url)
--     FROM public.postulaciones
--     WHERE created_at < NOW() - INTERVAL '90 days';
--
--     -- Eliminar postulaciones antiguas
--     DELETE FROM public.postulaciones
--     WHERE created_at < NOW() - INTERVAL '90 days';
--
--     -- Desactivar ofertas expiradas
--     UPDATE public.ofertas
--     SET activa = FALSE
--     WHERE expira_en < NOW() AND activa = TRUE;
--   $$
-- );
