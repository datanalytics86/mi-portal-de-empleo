-- ═══════════════════════════════════════════════════════════════════════════
-- PORTAL DE EMPLEOS CHILE - DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Este script crea el schema completo de la base de datos en Supabase
-- Basado en SPECIFICATIONS.md secciones 3 y 9
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
--
-- IMPORTANTE: Ejecutar estos comandos en orden
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONES
-- ───────────────────────────────────────────────────────────────────────────

-- Habilitar PostGIS para georeferenciación
CREATE EXTENSION IF NOT EXISTS postgis;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. TABLAS
-- ───────────────────────────────────────────────────────────────────────────

-- Tabla de empleadores
-- Almacena información de las empresas registradas
CREATE TABLE IF NOT EXISTS empleadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre_empresa TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios en tabla
COMMENT ON TABLE empleadores IS 'Empresas registradas que publican ofertas de trabajo';
COMMENT ON COLUMN empleadores.id IS 'ID único del empleador (UUID v4)';
COMMENT ON COLUMN empleadores.email IS 'Email de autenticación del empleador';
COMMENT ON COLUMN empleadores.nombre_empresa IS 'Nombre comercial de la empresa';

-- ───────────────────────────────────────────────────────────────────────────

-- Tabla de ofertas
-- Almacena las ofertas de trabajo publicadas
CREATE TABLE IF NOT EXISTS ofertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleador_id UUID NOT NULL REFERENCES empleadores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  empresa TEXT NOT NULL,
  tipo_jornada TEXT NOT NULL CHECK (tipo_jornada IN ('Full-time', 'Part-time', 'Freelance', 'Práctica')),
  categoria TEXT,
  comuna TEXT NOT NULL,
  ubicacion GEOGRAPHY(POINT, 4326),  -- Coordenadas geográficas (lat/lng)
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Comentarios en tabla
COMMENT ON TABLE ofertas IS 'Ofertas de trabajo publicadas por empleadores';
COMMENT ON COLUMN ofertas.ubicacion IS 'Coordenadas geográficas en formato POINT(lng, lat) - SRID 4326';
COMMENT ON COLUMN ofertas.tipo_jornada IS 'Tipo de jornada: Full-time, Part-time, Freelance, Práctica';
COMMENT ON COLUMN ofertas.activa IS 'Indica si la oferta está activa y visible públicamente';
COMMENT ON COLUMN ofertas.expires_at IS 'Fecha de expiración automática (default 30 días)';

-- Índice espacial para búsquedas geográficas eficientes
CREATE INDEX IF NOT EXISTS idx_ofertas_ubicacion ON ofertas USING GIST(ubicacion);

-- Índices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_ofertas_empleador ON ofertas(empleador_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_activa ON ofertas(activa);
CREATE INDEX IF NOT EXISTS idx_ofertas_created_at ON ofertas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ofertas_tipo_jornada ON ofertas(tipo_jornada);
CREATE INDEX IF NOT EXISTS idx_ofertas_comuna ON ofertas(comuna);

-- ───────────────────────────────────────────────────────────────────────────

-- Tabla de postulaciones
-- Almacena las postulaciones de candidatos a ofertas
CREATE TABLE IF NOT EXISTS postulaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id UUID NOT NULL REFERENCES ofertas(id) ON DELETE CASCADE,
  nombre_candidato TEXT,
  email_candidato TEXT,
  cv_url TEXT NOT NULL,
  ip_address INET,  -- Para anti-spam y rate limiting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios en tabla
COMMENT ON TABLE postulaciones IS 'Postulaciones de candidatos a ofertas de trabajo';
COMMENT ON COLUMN postulaciones.nombre_candidato IS 'Nombre del candidato (opcional)';
COMMENT ON COLUMN postulaciones.email_candidato IS 'Email del candidato (opcional)';
COMMENT ON COLUMN postulaciones.cv_url IS 'URL del CV en Supabase Storage';
COMMENT ON COLUMN postulaciones.ip_address IS 'IP del candidato para rate limiting';

-- Índice para prevenir postulaciones duplicadas
CREATE INDEX IF NOT EXISTS idx_postulaciones_oferta_email
ON postulaciones(oferta_id, email_candidato)
WHERE email_candidato IS NOT NULL;

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_postulaciones_oferta ON postulaciones(oferta_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_ip ON postulaciones(ip_address, created_at);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (RLS)
-- ───────────────────────────────────────────────────────────────────────────

-- Habilitar RLS en todas las tablas
ALTER TABLE empleadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE postulaciones ENABLE ROW LEVEL SECURITY;

-- ─── POLICIES PARA EMPLEADORES ─────────────────────────────────────────────

-- Los empleadores solo pueden ver y gestionar sus propios datos
CREATE POLICY "Empleadores pueden ver su propio perfil"
ON empleadores FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Empleadores pueden actualizar su propio perfil"
ON empleadores FOR UPDATE
USING (auth.uid() = id);

-- ─── POLICIES PARA OFERTAS ─────────────────────────────────────────────────

-- Ofertas públicas: cualquiera puede ver ofertas activas
CREATE POLICY "Ofertas activas son públicas"
ON ofertas FOR SELECT
USING (activa = TRUE);

-- Solo empleadores autenticados pueden crear ofertas
CREATE POLICY "Empleadores pueden crear ofertas"
ON ofertas FOR INSERT
WITH CHECK (auth.uid() = empleador_id);

-- Solo el empleador propietario puede actualizar sus ofertas
CREATE POLICY "Empleadores pueden actualizar sus ofertas"
ON ofertas FOR UPDATE
USING (auth.uid() = empleador_id);

-- Solo el empleador propietario puede eliminar sus ofertas
CREATE POLICY "Empleadores pueden eliminar sus ofertas"
ON ofertas FOR DELETE
USING (auth.uid() = empleador_id);

-- ─── POLICIES PARA POSTULACIONES ───────────────────────────────────────────

-- Cualquiera puede crear una postulación (candidatos sin registro)
CREATE POLICY "Cualquiera puede postular"
ON postulaciones FOR INSERT
WITH CHECK (true);

-- Solo el empleador propietario de la oferta puede ver las postulaciones
CREATE POLICY "Empleadores ven postulaciones de sus ofertas"
ON postulaciones FOR SELECT
USING (
  oferta_id IN (
    SELECT id FROM ofertas WHERE empleador_id = auth.uid()
  )
);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. STORAGE BUCKET PARA CVs
-- ───────────────────────────────────────────────────────────────────────────

-- NOTA: Los buckets se crean desde el Dashboard de Supabase
-- Esta sección es solo para referencia

-- Crear bucket "cvs" con la siguiente configuración:
-- - Name: cvs
-- - Public: false (solo acceso autorizado)
-- - File size limit: 5MB (5242880 bytes)
-- - Allowed MIME types:
--   - application/pdf
--   - application/msword
--   - application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- ───────────────────────────────────────────────────────────────────────────
-- 5. STORAGE POLICIES PARA CVs
-- ───────────────────────────────────────────────────────────────────────────

-- Permitir que cualquiera suba CVs (validación en API route)
CREATE POLICY "Permitir upload de CVs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cvs');

-- Solo empleadores propietarios pueden descargar CVs de sus ofertas
CREATE POLICY "Empleadores descargan CVs de sus ofertas"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cvs' AND
  auth.uid() IN (
    SELECT o.empleador_id
    FROM ofertas o
    JOIN postulaciones p ON p.oferta_id = o.id
    WHERE p.cv_url = storage.objects.name
  )
);

-- Permitir que empleadores eliminen CVs de postulaciones a sus ofertas
CREATE POLICY "Empleadores pueden eliminar CVs de sus ofertas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cvs' AND
  auth.uid() IN (
    SELECT o.empleador_id
    FROM ofertas o
    JOIN postulaciones p ON p.oferta_id = o.id
    WHERE p.cv_url = storage.objects.name
  )
);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. FUNCIONES AUXILIARES
-- ───────────────────────────────────────────────────────────────────────────

-- Función para crear un punto geográfico desde lat/lng
CREATE OR REPLACE FUNCTION create_point(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS GEOGRAPHY
LANGUAGE SQL IMMUTABLE
AS $$
  SELECT ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY;
$$;

COMMENT ON FUNCTION create_point IS 'Crea un punto geográfico desde latitud y longitud';

-- Función para buscar ofertas cercanas a una ubicación
CREATE OR REPLACE FUNCTION ofertas_cercanas(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radio_metros INTEGER DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  empresa TEXT,
  comuna TEXT,
  distancia_metros DOUBLE PRECISION
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    o.id,
    o.titulo,
    o.empresa,
    o.comuna,
    ST_Distance(o.ubicacion, create_point(lat, lng)) AS distancia_metros
  FROM ofertas o
  WHERE
    o.activa = TRUE AND
    ST_DWithin(o.ubicacion, create_point(lat, lng), radio_metros)
  ORDER BY distancia_metros ASC;
$$;

COMMENT ON FUNCTION ofertas_cercanas IS 'Busca ofertas cercanas a una ubicación específica';

-- ───────────────────────────────────────────────────────────────────────────
-- 7. TRIGGERS
-- ───────────────────────────────────────────────────────────────────────────

-- Función para desactivar ofertas expiradas automáticamente
CREATE OR REPLACE FUNCTION desactivar_ofertas_expiradas()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  IF NEW.expires_at <= NOW() THEN
    NEW.activa := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta antes de actualizar una oferta
CREATE TRIGGER trigger_desactivar_ofertas_expiradas
BEFORE UPDATE ON ofertas
FOR EACH ROW
EXECUTE FUNCTION desactivar_ofertas_expiradas();

-- ───────────────────────────────────────────────────────────────────────────
-- 8. DATOS DE EJEMPLO (OPCIONAL - SOLO PARA DESARROLLO)
-- ───────────────────────────────────────────────────────────────────────────

-- Descomentar para insertar datos de prueba

/*
-- Empleador de ejemplo
INSERT INTO empleadores (id, email, nombre_empresa) VALUES
('00000000-0000-0000-0000-000000000001', 'empresa1@example.com', 'Tech Corp Chile');

-- Ofertas de ejemplo
INSERT INTO ofertas (empleador_id, titulo, descripcion, empresa, tipo_jornada, categoria, comuna, ubicacion) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Desarrollador Full Stack',
  'Buscamos desarrollador con experiencia en React y Node.js',
  'Tech Corp Chile',
  'Full-time',
  'Tecnología',
  'Santiago',
  create_point(-33.4489, -70.6693)
),
(
  '00000000-0000-0000-0000-000000000001',
  'Diseñador UX/UI',
  'Diseñador creativo para productos digitales',
  'Tech Corp Chile',
  'Part-time',
  'Diseño',
  'Providencia',
  create_point(-33.4333, -70.6167)
);
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DEL SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════

-- Verificar que todo se creó correctamente
SELECT
  'Tablas creadas: ' || COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('empleadores', 'ofertas', 'postulaciones');

SELECT 'Schema creado exitosamente! ✅' AS status;
