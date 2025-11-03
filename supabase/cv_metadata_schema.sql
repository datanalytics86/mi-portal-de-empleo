-- ============================================================================
-- TABLA: cv_metadata
-- Descripción: Almacena metadatos extraídos de CVs mediante IA
-- Autor: Sistema IA
-- Fecha: 2025-11-03
-- ============================================================================

-- Crear tabla cv_metadata
CREATE TABLE IF NOT EXISTS cv_metadata (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  postulacion_id UUID NOT NULL REFERENCES postulaciones(id) ON DELETE CASCADE,

  -- Datos personales extraídos
  nombre_completo VARCHAR(255),
  email_extraido VARCHAR(255),
  telefono_extraido VARCHAR(50),

  -- Información profesional
  titulo_profesional VARCHAR(255),
  resumen TEXT,
  anos_experiencia INTEGER CHECK (anos_experiencia >= 0 AND anos_experiencia <= 50),

  -- Arrays para búsqueda (PostgreSQL nativo)
  habilidades TEXT[] DEFAULT '{}',
  certificaciones TEXT[] DEFAULT '{}',

  -- JSONB para datos estructurados complejos
  idiomas JSONB DEFAULT '[]'::jsonb,
  /*
    Formato:
    [
      {"idioma": "Español", "nivel": "Nativo"},
      {"idioma": "Inglés", "nivel": "Avanzado (C1)"}
    ]
  */

  experiencia JSONB DEFAULT '[]'::jsonb,
  /*
    Formato:
    [
      {
        "empresa": "TechCorp",
        "cargo": "Developer",
        "desde": "2020-03",
        "hasta": "presente",
        "descripcion": "...",
        "logros": ["..."]
      }
    ]
  */

  educacion JSONB DEFAULT '[]'::jsonb,
  /*
    Formato:
    [
      {
        "institucion": "Universidad X",
        "titulo": "Ingeniería",
        "desde": "2015",
        "hasta": "2020"
      }
    ]
  */

  -- Texto completo para análisis
  texto_completo TEXT,

  -- Metadatos del parsing
  confianza_score DECIMAL(3,2) CHECK (confianza_score >= 0 AND confianza_score <= 1),
  modelo_usado VARCHAR(50), -- ej: "claude-3-5-sonnet-20241022"

  -- Full-text search vector
  search_vector TSVECTOR,

  -- Timestamps
  parsed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Solo un metadata por postulación
  CONSTRAINT cv_metadata_unique_postulacion UNIQUE (postulacion_id)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice para relación con postulaciones
CREATE INDEX IF NOT EXISTS idx_cv_metadata_postulacion
  ON cv_metadata(postulacion_id);

-- Índice GIN para búsqueda en arrays de habilidades
CREATE INDEX IF NOT EXISTS idx_cv_metadata_habilidades
  ON cv_metadata USING GIN(habilidades);

-- Índice GIN para búsqueda en arrays de certificaciones
CREATE INDEX IF NOT EXISTS idx_cv_metadata_certificaciones
  ON cv_metadata USING GIN(certificaciones);

-- Índice GIN para búsqueda en JSONB (idiomas, experiencia, educación)
CREATE INDEX IF NOT EXISTS idx_cv_metadata_idiomas
  ON cv_metadata USING GIN(idiomas);

CREATE INDEX IF NOT EXISTS idx_cv_metadata_experiencia
  ON cv_metadata USING GIN(experiencia);

CREATE INDEX IF NOT EXISTS idx_cv_metadata_educacion
  ON cv_metadata USING GIN(educacion);

-- Índice para búsqueda por años de experiencia
CREATE INDEX IF NOT EXISTS idx_cv_metadata_experiencia_anos
  ON cv_metadata(anos_experiencia) WHERE anos_experiencia IS NOT NULL;

-- Índice GIN para full-text search vector
CREATE INDEX IF NOT EXISTS idx_cv_metadata_search
  ON cv_metadata USING GIN(search_vector);

-- Índice para búsqueda full-text en español
CREATE INDEX IF NOT EXISTS idx_cv_metadata_fts
  ON cv_metadata USING GIN(
    to_tsvector('spanish',
      coalesce(nombre_completo, '') || ' ' ||
      coalesce(titulo_profesional, '') || ' ' ||
      coalesce(resumen, '') || ' ' ||
      coalesce(texto_completo, '')
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para actualizar search_vector automáticamente
CREATE OR REPLACE FUNCTION cv_metadata_update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('spanish',
    coalesce(NEW.nombre_completo, '') || ' ' ||
    coalesce(NEW.titulo_profesional, '') || ' ' ||
    coalesce(NEW.resumen, '') || ' ' ||
    coalesce(array_to_string(NEW.habilidades, ' '), '') || ' ' ||
    coalesce(array_to_string(NEW.certificaciones, ' '), '') || ' ' ||
    coalesce(NEW.texto_completo, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cv_metadata_search_vector_update ON cv_metadata;

CREATE TRIGGER cv_metadata_search_vector_update
  BEFORE INSERT OR UPDATE ON cv_metadata
  FOR EACH ROW
  EXECUTE FUNCTION cv_metadata_update_search_vector();

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION cv_metadata_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cv_metadata_timestamp_update ON cv_metadata;

CREATE TRIGGER cv_metadata_timestamp_update
  BEFORE UPDATE ON cv_metadata
  FOR EACH ROW
  EXECUTE FUNCTION cv_metadata_update_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE cv_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Empleadores pueden ver metadatos de CVs de sus ofertas
DROP POLICY IF EXISTS "Empleadores ven metadatos de sus postulaciones" ON cv_metadata;

CREATE POLICY "Empleadores ven metadatos de sus postulaciones"
  ON cv_metadata
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM postulaciones p
      JOIN ofertas o ON o.id = p.oferta_id
      WHERE p.id = cv_metadata.postulacion_id
        AND o.empleador_id = auth.uid()
    )
  );

-- Policy: Sistema puede insertar (Service Role)
DROP POLICY IF EXISTS "Sistema puede insertar metadatos" ON cv_metadata;

CREATE POLICY "Sistema puede insertar metadatos"
  ON cv_metadata
  FOR INSERT
  WITH CHECK (true); -- Usar Service Role Key

-- Policy: Sistema puede actualizar
DROP POLICY IF EXISTS "Sistema puede actualizar metadatos" ON cv_metadata;

CREATE POLICY "Sistema puede actualizar metadatos"
  ON cv_metadata
  FOR UPDATE
  USING (true);

-- ============================================================================
-- FUNCIONES DE BÚSQUEDA
-- ============================================================================

-- Función: Buscar candidatos por habilidades
CREATE OR REPLACE FUNCTION buscar_candidatos_por_habilidades(
  habilidades_requeridas TEXT[],
  anos_min_experiencia INTEGER DEFAULT 0,
  limite INTEGER DEFAULT 20
)
RETURNS TABLE (
  postulacion_id UUID,
  nombre_completo VARCHAR,
  titulo_profesional VARCHAR,
  anos_experiencia INTEGER,
  habilidades_match TEXT[],
  match_score DECIMAL,
  email_extraido VARCHAR,
  telefono_extraido VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.postulacion_id,
    cm.nombre_completo,
    cm.titulo_profesional,
    cm.anos_experiencia,
    cm.habilidades && habilidades_requeridas AS habilidades_match,
    -- Score basado en % de habilidades que coinciden
    ROUND(
      (SELECT COUNT(*)::DECIMAL FROM unnest(cm.habilidades) AS h WHERE h = ANY(habilidades_requeridas))
      / NULLIF(array_length(habilidades_requeridas, 1), 0) * 100,
      2
    ) AS match_score,
    cm.email_extraido,
    cm.telefono_extraido
  FROM cv_metadata cm
  WHERE
    cm.habilidades && habilidades_requeridas -- Al menos 1 habilidad coincide
    AND cm.anos_experiencia >= anos_min_experiencia
  ORDER BY match_score DESC, cm.anos_experiencia DESC
  LIMIT limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Búsqueda full-text en CVs
CREATE OR REPLACE FUNCTION buscar_candidatos_fulltext(
  busqueda TEXT,
  limite INTEGER DEFAULT 20
)
RETURNS TABLE (
  postulacion_id UUID,
  nombre_completo VARCHAR,
  titulo_profesional VARCHAR,
  resumen TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.postulacion_id,
    cm.nombre_completo,
    cm.titulo_profesional,
    cm.resumen,
    ts_rank(cm.search_vector, query) AS rank
  FROM
    cv_metadata cm,
    plainto_tsquery('spanish', busqueda) query
  WHERE cm.search_vector @@ query
  ORDER BY rank DESC
  LIMIT limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener estadísticas de habilidades
CREATE OR REPLACE FUNCTION estadisticas_habilidades()
RETURNS TABLE (
  habilidad TEXT,
  cantidad BIGINT,
  porcentaje DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH total AS (
    SELECT COUNT(DISTINCT id) AS total_cvs FROM cv_metadata
  ),
  habilidad_count AS (
    SELECT unnest(habilidades) AS habilidad, COUNT(*) AS cantidad
    FROM cv_metadata
    GROUP BY habilidad
  )
  SELECT
    hc.habilidad,
    hc.cantidad,
    ROUND((hc.cantidad::DECIMAL / t.total_cvs * 100), 2) AS porcentaje
  FROM habilidad_count hc, total t
  ORDER BY hc.cantidad DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE cv_metadata IS 'Metadatos extraídos de CVs mediante IA para búsqueda y matching';
COMMENT ON COLUMN cv_metadata.habilidades IS 'Array de habilidades técnicas y profesionales';
COMMENT ON COLUMN cv_metadata.idiomas IS 'JSONB con idiomas y niveles de competencia';
COMMENT ON COLUMN cv_metadata.experiencia IS 'JSONB con historial laboral completo';
COMMENT ON COLUMN cv_metadata.educacion IS 'JSONB con formación académica';
COMMENT ON COLUMN cv_metadata.confianza_score IS 'Score de confianza de la IA (0.00-1.00)';
COMMENT ON COLUMN cv_metadata.search_vector IS 'Vector para búsqueda full-text en español';

-- ============================================================================
-- GRANTS (Opcional: Ajustar según roles de tu DB)
-- ============================================================================

-- Los empleadores pueden leer mediante RLS policies
-- El servicio usa Service Role Key con acceso total

-- ============================================================================
-- EJEMPLOS DE USO
-- ============================================================================

/*
-- 1. Insertar metadatos de un CV
INSERT INTO cv_metadata (
  postulacion_id,
  nombre_completo,
  titulo_profesional,
  anos_experiencia,
  habilidades,
  idiomas,
  experiencia,
  texto_completo,
  confianza_score,
  modelo_usado
) VALUES (
  'uuid-postulacion-aqui',
  'Juan Pérez',
  'Desarrollador Full Stack',
  5,
  ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
  '[{"idioma": "Español", "nivel": "Nativo"}, {"idioma": "Inglés", "nivel": "Avanzado"}]'::jsonb,
  '[{"empresa": "TechCorp", "cargo": "Developer", "desde": "2019", "hasta": "presente"}]'::jsonb,
  'Texto completo del CV aquí...',
  0.92,
  'claude-3-5-sonnet-20241022'
);

-- 2. Buscar candidatos con React y Node.js, mínimo 3 años de experiencia
SELECT * FROM buscar_candidatos_por_habilidades(
  ARRAY['React', 'Node.js'],
  3,
  10
);

-- 3. Búsqueda full-text: "desarrollador frontend react"
SELECT * FROM buscar_candidatos_fulltext('desarrollador frontend react', 10);

-- 4. Top 10 habilidades más comunes
SELECT * FROM estadisticas_habilidades();

-- 5. Buscar candidatos que hablen inglés avanzado
SELECT
  cm.nombre_completo,
  cm.titulo_profesional,
  cm.idiomas
FROM cv_metadata cm
WHERE cm.idiomas @> '[{"idioma": "Inglés"}]'::jsonb
  AND cm.idiomas::text ILIKE '%Avanzado%';

-- 6. Buscar candidatos con experiencia en empresa específica
SELECT
  cm.nombre_completo,
  cm.titulo_profesional,
  cm.experiencia
FROM cv_metadata cm
WHERE cm.experiencia::text ILIKE '%Google%';
*/
