-- ============================================
-- SCHEMA DE BASE DE DATOS - PORTAL DE EMPLEO CHILE
-- Version: 1.0.0
-- Descripción: Schema completo con mejoras de seguridad y performance
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Para búsqueda full-text mejorada

-- ============================================
-- TABLA: empleadores
-- ============================================
CREATE TABLE IF NOT EXISTS empleadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre_empresa TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para empleadores
CREATE INDEX IF NOT EXISTS idx_empleadores_email ON empleadores(email);
CREATE INDEX IF NOT EXISTS idx_empleadores_created ON empleadores(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empleadores_updated_at
    BEFORE UPDATE ON empleadores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: ofertas
-- ============================================
CREATE TABLE IF NOT EXISTS ofertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleador_id UUID NOT NULL REFERENCES empleadores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  empresa TEXT NOT NULL,
  tipo_jornada TEXT NOT NULL CHECK (tipo_jornada IN ('Full-time', 'Part-time', 'Freelance', 'Práctica')),
  categoria TEXT,
  comuna TEXT NOT NULL,
  ubicacion GEOGRAPHY(POINT, 4326), -- PostGIS: lat/lng
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),

  -- Constraints
  CONSTRAINT titulo_min_length CHECK (length(titulo) >= 10),
  CONSTRAINT descripcion_min_length CHECK (length(descripcion) >= 50),
  CONSTRAINT expires_at_future CHECK (expires_at > created_at)
);

-- Índices espaciales y de búsqueda para ofertas
CREATE INDEX IF NOT EXISTS idx_ofertas_ubicacion ON ofertas USING GIST(ubicacion);
CREATE INDEX IF NOT EXISTS idx_ofertas_activa_created ON ofertas(activa, created_at DESC) WHERE activa = TRUE;
CREATE INDEX IF NOT EXISTS idx_ofertas_categoria ON ofertas(categoria) WHERE activa = TRUE;
CREATE INDEX IF NOT EXISTS idx_ofertas_tipo_jornada ON ofertas(tipo_jornada) WHERE activa = TRUE;
CREATE INDEX IF NOT EXISTS idx_ofertas_comuna ON ofertas(comuna) WHERE activa = TRUE;
CREATE INDEX IF NOT EXISTS idx_ofertas_empleador ON ofertas(empleador_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_expires ON ofertas(expires_at) WHERE activa = TRUE;

-- Índice compuesto para búsquedas complejas
CREATE INDEX IF NOT EXISTS idx_ofertas_busqueda_compuesta
  ON ofertas(activa, categoria, tipo_jornada, comuna, created_at DESC);

-- Índice GIN para búsqueda full-text (pg_trgm)
CREATE INDEX IF NOT EXISTS idx_ofertas_titulo_trgm ON ofertas USING GIN (titulo gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ofertas_descripcion_trgm ON ofertas USING GIN (descripcion gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ofertas_empresa_trgm ON ofertas USING GIN (empresa gin_trgm_ops);

-- Trigger para updated_at
CREATE TRIGGER update_ofertas_updated_at
    BEFORE UPDATE ON ofertas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para auto-desactivar ofertas expiradas
CREATE OR REPLACE FUNCTION deactivate_expired_ofertas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at < NOW() AND NEW.activa = TRUE THEN
        NEW.activa = FALSE;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_ofertas_expiration
    BEFORE UPDATE ON ofertas
    FOR EACH ROW
    EXECUTE FUNCTION deactivate_expired_ofertas();

-- ============================================
-- TABLA: postulaciones
-- ============================================
CREATE TABLE IF NOT EXISTS postulaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id UUID NOT NULL REFERENCES ofertas(id) ON DELETE CASCADE,
  nombre_candidato TEXT,
  email_candidato TEXT,
  cv_url TEXT NOT NULL,
  ip_hash TEXT NOT NULL, -- Hash SHA-256 de la IP (no la IP real)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT cv_url_not_empty CHECK (length(cv_url) > 0)
);

-- Índices para postulaciones
CREATE INDEX IF NOT EXISTS idx_postulaciones_oferta ON postulaciones(oferta_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_created ON postulaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_postulaciones_ip_hash_created ON postulaciones(ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_postulaciones_email_created ON postulaciones(email_candidato, created_at DESC)
  WHERE email_candidato IS NOT NULL;

-- Índice compuesto para prevenir duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_postulaciones_oferta_email_unique
  ON postulaciones(oferta_id, email_candidato)
  WHERE email_candidato IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE empleadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE postulaciones ENABLE ROW LEVEL SECURITY;

-- Políticas para EMPLEADORES
-- Los empleadores solo pueden ver y modificar sus propios datos
CREATE POLICY "Empleadores pueden ver su perfil" ON empleadores
  FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Empleadores pueden actualizar su perfil" ON empleadores
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Políticas para OFERTAS
-- Ofertas activas son públicas para lectura
CREATE POLICY "Ofertas activas son públicas" ON ofertas
  FOR SELECT
  USING (activa = TRUE AND expires_at > NOW());

-- Solo el empleador propietario puede crear ofertas
CREATE POLICY "Empleadores pueden crear ofertas" ON ofertas
  FOR INSERT
  WITH CHECK (auth.uid()::text = empleador_id::text);

-- Solo el empleador propietario puede actualizar/eliminar sus ofertas
CREATE POLICY "Empleadores gestionan sus ofertas" ON ofertas
  FOR UPDATE
  USING (auth.uid()::text = empleador_id::text);

CREATE POLICY "Empleadores eliminan sus ofertas" ON ofertas
  FOR DELETE
  USING (auth.uid()::text = empleador_id::text);

-- Políticas para POSTULACIONES
-- Solo el empleador propietario de la oferta puede ver las postulaciones
CREATE POLICY "Empleadores ven postulaciones de sus ofertas" ON postulaciones
  FOR SELECT
  USING (
    oferta_id IN (
      SELECT id FROM ofertas
      WHERE empleador_id::text = auth.uid()::text
    )
  );

-- Cualquiera puede crear postulaciones (validado en la API)
CREATE POLICY "Permitir crear postulaciones" ON postulaciones
  FOR INSERT
  WITH CHECK (TRUE);

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

/**
 * Función para buscar ofertas cercanas a una ubicación
 * Usa PostGIS para cálculo de distancias
 */
CREATE OR REPLACE FUNCTION buscar_ofertas_cercanas(
  lat_centro DOUBLE PRECISION,
  lng_centro DOUBLE PRECISION,
  radio_km INTEGER DEFAULT 10,
  limite INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  empresa TEXT,
  comuna TEXT,
  distancia_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.titulo,
    o.empresa,
    o.comuna,
    ST_Distance(
      o.ubicacion::geography,
      ST_SetSRID(ST_MakePoint(lng_centro, lat_centro), 4326)::geography
    ) / 1000 AS distancia_km
  FROM ofertas o
  WHERE
    o.activa = TRUE
    AND o.expires_at > NOW()
    AND ST_DWithin(
      o.ubicacion::geography,
      ST_SetSRID(ST_MakePoint(lng_centro, lat_centro), 4326)::geography,
      radio_km * 1000
    )
  ORDER BY distancia_km ASC
  LIMIT limite;
END;
$$ LANGUAGE plpgsql;

/**
 * Función para obtener estadísticas de un empleador
 */
CREATE OR REPLACE FUNCTION estadisticas_empleador(empleador_uuid UUID)
RETURNS TABLE (
  total_ofertas BIGINT,
  ofertas_activas BIGINT,
  total_postulaciones BIGINT,
  postulaciones_ultima_semana BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT o.id),
    COUNT(DISTINCT CASE WHEN o.activa = TRUE THEN o.id END),
    COUNT(p.id),
    COUNT(CASE WHEN p.created_at > NOW() - INTERVAL '7 days' THEN p.id END)
  FROM ofertas o
  LEFT JOIN postulaciones p ON p.oferta_id = o.id
  WHERE o.empleador_id = empleador_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Vista materializada para estadísticas globales (actualizar periódicamente)
 */
CREATE MATERIALIZED VIEW IF NOT EXISTS stats_globales AS
SELECT
  COUNT(DISTINCT o.id) as total_ofertas_activas,
  COUNT(DISTINCT p.id) as total_postulaciones,
  COUNT(DISTINCT o.empleador_id) as total_empleadores,
  COUNT(DISTINCT o.comuna) as total_comunas_con_ofertas,
  NOW() as actualizado_at
FROM ofertas o
LEFT JOIN postulaciones p ON p.oferta_id = o.id
WHERE o.activa = TRUE AND o.expires_at > NOW();

-- Índice para la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_stats_globales_unique ON stats_globales(actualizado_at);

/**
 * Función para refrescar estadísticas (llamar con cron job)
 */
CREATE OR REPLACE FUNCTION refresh_stats_globales()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY stats_globales;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS PARA LIMPIEZA AUTOMÁTICA
-- ============================================

/**
 * Trigger para eliminar postulaciones antiguas (>90 días)
 * Ejecutar con un cron job: SELECT cleanup_old_postulaciones();
 */
CREATE OR REPLACE FUNCTION cleanup_old_postulaciones()
RETURNS void AS $$
BEGIN
  DELETE FROM postulaciones
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DATOS INICIALES (OPCIONAL)
-- ============================================

-- Categorías predefinidas (opcional, puede hacerse en la aplicación)
-- COMMENT ON COLUMN ofertas.categoria IS
-- 'Valores permitidos: Tecnología, Ventas, Administración, Marketing, Finanzas,
-- Recursos Humanos, Ingeniería, Salud, Educación, Logística, Construcción,
-- Gastronomía, Turismo, Legal, Diseño, Atención al Cliente, Producción, Otros';

-- ============================================
-- PERMISOS
-- ============================================

-- Asegurar que el servicio Supabase tenga los permisos correctos
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- NOTAS FINALES
-- ============================================

/*
Para ejecutar este schema en Supabase:
1. Ve al SQL Editor en tu proyecto de Supabase
2. Copia y pega este archivo completo
3. Ejecuta el script
4. Verifica que todas las tablas, índices y políticas se crearon correctamente

Para actualizar estadísticas periódicamente, crear un cron job:
SELECT cron.schedule(
  'refresh-stats',
  '0 * * * *', -- cada hora
  $$ SELECT refresh_stats_globales(); $$
);

Para limpiar postulaciones antiguas, crear un cron job:
SELECT cron.schedule(
  'cleanup-postulaciones',
  '0 2 * * *', -- a las 2 AM todos los días
  $$ SELECT cleanup_old_postulaciones(); $$
);
*/
