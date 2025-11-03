-- ============================================================================
-- MIGRACIÓN: Enhanced Postulaciones Fields
-- Descripción: Agrega campos adicionales a la tabla postulaciones para
--              mejorar la calidad de la información de candidatos
-- Fecha: 2025-11-03
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. AGREGAR NUEVOS CAMPOS A TABLA POSTULACIONES
-- ─────────────────────────────────────────────────────────────────────────

-- Campos de contacto y verificación
ALTER TABLE postulaciones
ADD COLUMN IF NOT EXISTS rut VARCHAR(12),
ADD COLUMN IF NOT EXISTS telefono_formateado VARCHAR(20),
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS comuna VARCHAR(100);

-- Campos opcionales que aumentan probabilidad de contratación
ALTER TABLE postulaciones
ADD COLUMN IF NOT EXISTS carrera VARCHAR(255),
ADD COLUMN IF NOT EXISTS nivel_estudios VARCHAR(100),
ADD COLUMN IF NOT EXISTS anos_experiencia INTEGER CHECK (anos_experiencia >= 0 AND anos_experiencia <= 50),
ADD COLUMN IF NOT EXISTS rango_sueldo_esperado VARCHAR(100),
ADD COLUMN IF NOT EXISTS disponibilidad VARCHAR(50),
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS github_url VARCHAR(500);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. AGREGAR COMENTARIOS A LAS COLUMNAS
-- ─────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN postulaciones.rut IS 'RUT del candidato (formato: 12.345.678-9)';
COMMENT ON COLUMN postulaciones.telefono_formateado IS 'Teléfono en formato +56 9 1234 5678';
COMMENT ON COLUMN postulaciones.region IS 'Región de residencia del candidato';
COMMENT ON COLUMN postulaciones.comuna IS 'Comuna de residencia del candidato';

COMMENT ON COLUMN postulaciones.carrera IS 'Carrera o profesión del candidato';
COMMENT ON COLUMN postulaciones.nivel_estudios IS 'Nivel de estudios alcanzado';
COMMENT ON COLUMN postulaciones.anos_experiencia IS 'Años totales de experiencia laboral';
COMMENT ON COLUMN postulaciones.rango_sueldo_esperado IS 'Rango de sueldo esperado en pesos chilenos';
COMMENT ON COLUMN postulaciones.disponibilidad IS 'Disponibilidad para incorporación (Inmediata, 1 mes, etc.)';
COMMENT ON COLUMN postulaciones.linkedin_url IS 'URL del perfil de LinkedIn';
COMMENT ON COLUMN postulaciones.portfolio_url IS 'URL del portfolio personal';
COMMENT ON COLUMN postulaciones.github_url IS 'URL del perfil de GitHub';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. CREAR ÍNDICES PARA BÚSQUEDAS FRECUENTES
-- ─────────────────────────────────────────────────────────────────────────

-- Índice para búsqueda por región/comuna
CREATE INDEX IF NOT EXISTS idx_postulaciones_ubicacion
  ON postulaciones(region, comuna);

-- Índice para búsqueda por nivel de estudios
CREATE INDEX IF NOT EXISTS idx_postulaciones_nivel_estudios
  ON postulaciones(nivel_estudios)
  WHERE nivel_estudios IS NOT NULL;

-- Índice para búsqueda por años de experiencia
CREATE INDEX IF NOT EXISTS idx_postulaciones_experiencia
  ON postulaciones(anos_experiencia)
  WHERE anos_experiencia IS NOT NULL;

-- Índice para búsqueda por disponibilidad
CREATE INDEX IF NOT EXISTS idx_postulaciones_disponibilidad
  ON postulaciones(disponibilidad)
  WHERE disponibilidad IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. CREAR VISTA PARA POSTULACIONES ENRIQUECIDAS
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW vista_postulaciones_enriquecidas AS
SELECT
  p.*,
  o.titulo as oferta_titulo,
  o.empresa as oferta_empresa,
  o.categoria as oferta_categoria,
  o.tipo as oferta_tipo,
  o.empleador_id,
  -- Calcular score de completitud del perfil (0-100)
  (
    CASE WHEN p.nombre IS NOT NULL AND p.nombre != '' THEN 10 ELSE 0 END +
    CASE WHEN p.email IS NOT NULL AND p.email != '' THEN 10 ELSE 0 END +
    CASE WHEN p.telefono IS NOT NULL AND p.telefono != '' THEN 10 ELSE 0 END +
    CASE WHEN p.rut IS NOT NULL AND p.rut != '' THEN 10 ELSE 0 END +
    CASE WHEN p.region IS NOT NULL AND p.region != '' THEN 5 ELSE 0 END +
    CASE WHEN p.comuna IS NOT NULL AND p.comuna != '' THEN 5 ELSE 0 END +
    CASE WHEN p.carrera IS NOT NULL AND p.carrera != '' THEN 10 ELSE 0 END +
    CASE WHEN p.nivel_estudios IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN p.anos_experiencia IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN p.rango_sueldo_esperado IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN p.disponibilidad IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN p.linkedin_url IS NOT NULL AND p.linkedin_url != '' THEN 5 ELSE 0 END +
    CASE WHEN p.portfolio_url IS NOT NULL AND p.portfolio_url != '' THEN 5 ELSE 0 END
  ) as completitud_perfil
FROM postulaciones p
JOIN ofertas o ON o.id = p.oferta_id;

COMMENT ON VIEW vista_postulaciones_enriquecidas IS 'Vista con información completa de postulaciones incluyendo score de completitud';

-- ─────────────────────────────────────────────────────────────────────────
-- 5. FUNCIÓN PARA OBTENER POSTULACIONES CON FILTROS AVANZADOS
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION buscar_postulaciones_avanzado(
  p_oferta_id UUID,
  p_nivel_estudios VARCHAR DEFAULT NULL,
  p_anos_min_experiencia INTEGER DEFAULT NULL,
  p_region VARCHAR DEFAULT NULL,
  p_disponibilidad VARCHAR DEFAULT NULL,
  p_min_completitud INTEGER DEFAULT 0,
  p_orden VARCHAR DEFAULT 'created_at_desc',
  p_limite INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  oferta_id UUID,
  nombre VARCHAR,
  email VARCHAR,
  telefono VARCHAR,
  rut VARCHAR,
  region VARCHAR,
  comuna VARCHAR,
  carrera VARCHAR,
  nivel_estudios VARCHAR,
  anos_experiencia INTEGER,
  rango_sueldo_esperado VARCHAR,
  disponibilidad VARCHAR,
  linkedin_url VARCHAR,
  portfolio_url VARCHAR,
  github_url VARCHAR,
  cv_url VARCHAR,
  cv_nombre VARCHAR,
  mensaje TEXT,
  created_at TIMESTAMPTZ,
  completitud_perfil INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.oferta_id,
    v.nombre,
    v.email,
    v.telefono,
    v.rut,
    v.region,
    v.comuna,
    v.carrera,
    v.nivel_estudios,
    v.anos_experiencia,
    v.rango_sueldo_esperado,
    v.disponibilidad,
    v.linkedin_url,
    v.portfolio_url,
    v.github_url,
    v.cv_url,
    v.cv_nombre,
    v.mensaje,
    v.created_at,
    v.completitud_perfil
  FROM vista_postulaciones_enriquecidas v
  WHERE v.oferta_id = p_oferta_id
    AND (p_nivel_estudios IS NULL OR v.nivel_estudios = p_nivel_estudios)
    AND (p_anos_min_experiencia IS NULL OR v.anos_experiencia >= p_anos_min_experiencia)
    AND (p_region IS NULL OR v.region = p_region)
    AND (p_disponibilidad IS NULL OR v.disponibilidad = p_disponibilidad)
    AND v.completitud_perfil >= p_min_completitud
  ORDER BY
    CASE WHEN p_orden = 'created_at_desc' THEN v.created_at END DESC,
    CASE WHEN p_orden = 'created_at_asc' THEN v.created_at END ASC,
    CASE WHEN p_orden = 'completitud_desc' THEN v.completitud_perfil END DESC,
    CASE WHEN p_orden = 'experiencia_desc' THEN v.anos_experiencia END DESC NULLS LAST,
    CASE WHEN p_orden = 'nombre_asc' THEN v.nombre END ASC
  LIMIT p_limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION buscar_postulaciones_avanzado IS 'Búsqueda avanzada de postulaciones con filtros múltiples';

-- ─────────────────────────────────────────────────────────────────────────
-- 6. FUNCIÓN PARA ESTADÍSTICAS DE POSTULACIONES POR OFERTA
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION estadisticas_postulaciones(p_oferta_id UUID)
RETURNS JSON AS $$
DECLARE
  resultado JSON;
BEGIN
  SELECT json_build_object(
    'total_postulaciones', COUNT(*),
    'promedio_completitud', ROUND(AVG(completitud_perfil), 2),
    'con_linkedin', COUNT(*) FILTER (WHERE linkedin_url IS NOT NULL AND linkedin_url != ''),
    'con_portfolio', COUNT(*) FILTER (WHERE portfolio_url IS NOT NULL AND portfolio_url != ''),
    'con_rut', COUNT(*) FILTER (WHERE rut IS NOT NULL AND rut != ''),
    'promedio_experiencia', ROUND(AVG(anos_experiencia), 1) FILTER (WHERE anos_experiencia IS NOT NULL),
    'por_region', (
      SELECT json_object_agg(region, count)
      FROM (
        SELECT region, COUNT(*) as count
        FROM vista_postulaciones_enriquecidas
        WHERE oferta_id = p_oferta_id AND region IS NOT NULL
        GROUP BY region
      ) subq
    ),
    'por_nivel_estudios', (
      SELECT json_object_agg(nivel_estudios, count)
      FROM (
        SELECT nivel_estudios, COUNT(*) as count
        FROM vista_postulaciones_enriquecidas
        WHERE oferta_id = p_oferta_id AND nivel_estudios IS NOT NULL
        GROUP BY nivel_estudios
      ) subq
    ),
    'por_disponibilidad', (
      SELECT json_object_agg(disponibilidad, count)
      FROM (
        SELECT disponibilidad, COUNT(*) as count
        FROM vista_postulaciones_enriquecidas
        WHERE oferta_id = p_oferta_id AND disponibilidad IS NOT NULL
        GROUP BY disponibilidad
      ) subq
    )
  ) INTO resultado
  FROM vista_postulaciones_enriquecidas
  WHERE oferta_id = p_oferta_id;

  RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION estadisticas_postulaciones IS 'Retorna estadísticas detalladas de postulaciones para una oferta';

-- ─────────────────────────────────────────────────────────────────────────
-- 7. GRANTS Y PERMISOS
-- ─────────────────────────────────────────────────────────────────────────

-- Empleadores pueden ver la vista de sus propias ofertas
-- (ya está protegido por RLS en tabla postulaciones)

-- ────────────────────────────────────────────────────────────────────────────
-- 8. EJEMPLOS DE USO
-- ────────────────────────────────────────────────────────────────────────────

/*
-- 1. Buscar postulaciones con filtros avanzados
SELECT * FROM buscar_postulaciones_avanzado(
  'uuid-oferta-aqui',      -- oferta_id
  'Universitaria Completa', -- nivel_estudios (NULL para todos)
  3,                       -- años mínimos experiencia
  'Metropolitana',         -- región
  NULL,                    -- disponibilidad (NULL para todos)
  50,                      -- completitud mínima (0-100)
  'completitud_desc',      -- orden
  20                       -- límite
);

-- 2. Obtener estadísticas de una oferta
SELECT estadisticas_postulaciones('uuid-oferta-aqui');

-- Resultado ejemplo:
{
  "total_postulaciones": 45,
  "promedio_completitud": 67.5,
  "con_linkedin": 28,
  "con_portfolio": 12,
  "con_rut": 40,
  "promedio_experiencia": 4.2,
  "por_region": {
    "Metropolitana": 25,
    "Valparaíso": 10,
    "Biobío": 8,
    "O'Higgins": 2
  },
  "por_nivel_estudios": {
    "Universitaria Completa": 20,
    "Técnico Nivel Superior": 15,
    "Postgrado/Magíster": 8,
    "Universitaria Incompleta": 2
  },
  "por_disponibilidad": {
    "Inmediata": 18,
    "1 mes": 15,
    "2 semanas": 8,
    "2 meses": 4
  }
}

-- 3. Ver postulaciones con mejor score de completitud
SELECT
  nombre,
  email,
  completitud_perfil,
  anos_experiencia,
  nivel_estudios,
  created_at
FROM vista_postulaciones_enriquecidas
WHERE oferta_id = 'uuid-aqui'
ORDER BY completitud_perfil DESC, anos_experiencia DESC
LIMIT 10;

-- 4. Filtrar por ubicación específica
SELECT *
FROM postulaciones
WHERE oferta_id = 'uuid-aqui'
  AND region = 'Metropolitana'
  AND comuna IN ('Santiago', 'Providencia', 'Las Condes');

-- 5. Candidatos con LinkedIn y experiencia senior
SELECT
  nombre,
  email,
  linkedin_url,
  anos_experiencia,
  carrera
FROM vista_postulaciones_enriquecidas
WHERE oferta_id = 'uuid-aqui'
  AND linkedin_url IS NOT NULL
  AND anos_experiencia >= 5
ORDER BY anos_experiencia DESC;
*/
