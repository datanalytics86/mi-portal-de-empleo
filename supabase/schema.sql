-- ========================================
-- Portal de Empleos Chile - Database Schema
-- ========================================
-- Este schema debe ejecutarse en Supabase SQL Editor
-- Versión: 1.0
-- Fecha: 2025-11-03

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda full-text

-- ========================================
-- TABLA: empleadores
-- ========================================
-- Almacena información de las empresas/empleadores
-- Se vincula con auth.users de Supabase Auth

CREATE TABLE IF NOT EXISTS empleadores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  empresa VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_empleadores_empresa ON empleadores(empresa);

COMMENT ON TABLE empleadores IS 'Información de empleadores registrados en el portal';
COMMENT ON COLUMN empleadores.id IS 'UUID que referencia a auth.users';
COMMENT ON COLUMN empleadores.nombre IS 'Nombre del representante de la empresa';
COMMENT ON COLUMN empleadores.empresa IS 'Nombre de la empresa';

-- ========================================
-- TABLA: ofertas
-- ========================================
-- Almacena las ofertas de empleo publicadas

CREATE TABLE IF NOT EXISTS ofertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleador_id UUID NOT NULL REFERENCES empleadores(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  empresa VARCHAR(255) NOT NULL,
  ubicacion JSONB NOT NULL, -- { region, comuna, direccion, lat, lng }
  tipo VARCHAR(50) NOT NULL, -- Full-time, Part-time, Remoto, Freelance, Temporal
  categoria VARCHAR(100) NOT NULL, -- Tecnología, Salud, Educación, etc.
  salario JSONB, -- { minimo, maximo, moneda, periodo }
  requisitos TEXT[] DEFAULT '{}',
  beneficios TEXT[] DEFAULT '{}',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT ofertas_tipo_check CHECK (
    tipo IN ('Full-time', 'Part-time', 'Remoto', 'Freelance', 'Temporal')
  )
);

-- Índices para mejorar performance de búsquedas
CREATE INDEX IF NOT EXISTS idx_ofertas_empleador ON ofertas(empleador_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_activa ON ofertas(activa);
CREATE INDEX IF NOT EXISTS idx_ofertas_categoria ON ofertas(categoria);
CREATE INDEX IF NOT EXISTS idx_ofertas_tipo ON ofertas(tipo);
CREATE INDEX IF NOT EXISTS idx_ofertas_region ON ofertas USING GIN ((ubicacion->'region'));
CREATE INDEX IF NOT EXISTS idx_ofertas_comuna ON ofertas USING GIN ((ubicacion->'comuna'));
CREATE INDEX IF NOT EXISTS idx_ofertas_created_at ON ofertas(created_at DESC);

-- Índice para búsqueda full-text en titulo y descripcion
CREATE INDEX IF NOT EXISTS idx_ofertas_search ON ofertas USING GIN (
  to_tsvector('spanish', titulo || ' ' || descripcion || ' ' || empresa)
);

COMMENT ON TABLE ofertas IS 'Ofertas de empleo publicadas por empleadores';
COMMENT ON COLUMN ofertas.ubicacion IS 'JSONB con region, comuna, direccion, lat, lng';
COMMENT ON COLUMN ofertas.salario IS 'JSONB con minimo, maximo, moneda (CLP), periodo';
COMMENT ON COLUMN ofertas.requisitos IS 'Array de requisitos del puesto';
COMMENT ON COLUMN ofertas.beneficios IS 'Array de beneficios ofrecidos';

-- ========================================
-- TABLA: postulaciones
-- ========================================
-- Almacena las postulaciones de candidatos a ofertas

CREATE TABLE IF NOT EXISTS postulaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oferta_id UUID NOT NULL REFERENCES ofertas(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  mensaje TEXT,
  cv_url TEXT NOT NULL, -- URL del archivo en Supabase Storage
  cv_nombre VARCHAR(255) NOT NULL,
  cv_size INTEGER NOT NULL, -- Tamaño en bytes
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint para evitar postulaciones duplicadas
  CONSTRAINT postulaciones_unique UNIQUE (oferta_id, email)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_postulaciones_oferta ON postulaciones(oferta_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_email ON postulaciones(email);
CREATE INDEX IF NOT EXISTS idx_postulaciones_created_at ON postulaciones(created_at DESC);

COMMENT ON TABLE postulaciones IS 'Postulaciones de candidatos a ofertas de empleo';
COMMENT ON COLUMN postulaciones.cv_url IS 'URL del CV almacenado en Supabase Storage bucket archivos';
COMMENT ON CONSTRAINT postulaciones_unique ON postulaciones IS 'Previene postulaciones duplicadas del mismo email';

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
-- Habilitar RLS en todas las tablas

ALTER TABLE empleadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE postulaciones ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS RLS: empleadores
-- ========================================

-- Empleadores pueden ver su propio perfil
CREATE POLICY "Empleadores ven su perfil"
  ON empleadores FOR SELECT
  USING (auth.uid() = id);

-- Empleadores pueden actualizar su propio perfil
CREATE POLICY "Empleadores actualizan su perfil"
  ON empleadores FOR UPDATE
  USING (auth.uid() = id);

-- Permitir inserción automática al registrarse (desde trigger o función)
CREATE POLICY "Crear perfil empleador"
  ON empleadores FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ========================================
-- POLÍTICAS RLS: ofertas
-- ========================================

-- Todos pueden ver ofertas activas (sin autenticación)
CREATE POLICY "Todos ven ofertas activas"
  ON ofertas FOR SELECT
  USING (activa = true OR empleador_id = auth.uid());

-- Empleadores pueden crear ofertas (deben estar autenticados)
CREATE POLICY "Empleadores crean ofertas"
  ON ofertas FOR INSERT
  WITH CHECK (auth.uid() = empleador_id);

-- Empleadores pueden editar sus propias ofertas
CREATE POLICY "Empleadores editan sus ofertas"
  ON ofertas FOR UPDATE
  USING (auth.uid() = empleador_id);

-- Empleadores pueden eliminar sus propias ofertas
CREATE POLICY "Empleadores eliminan sus ofertas"
  ON ofertas FOR DELETE
  USING (auth.uid() = empleador_id);

-- ========================================
-- POLÍTICAS RLS: postulaciones
-- ========================================

-- Empleadores solo ven postulaciones de sus ofertas
CREATE POLICY "Empleadores ven postulaciones de sus ofertas"
  ON postulaciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ofertas
      WHERE ofertas.id = postulaciones.oferta_id
      AND ofertas.empleador_id = auth.uid()
    )
  );

-- Cualquiera puede postular (sin autenticación)
CREATE POLICY "Cualquiera postula"
  ON postulaciones FOR INSERT
  WITH CHECK (true);

-- ========================================
-- FUNCIONES Y TRIGGERS
-- ========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para empleadores
DROP TRIGGER IF EXISTS update_empleadores_updated_at ON empleadores;
CREATE TRIGGER update_empleadores_updated_at
  BEFORE UPDATE ON empleadores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para ofertas
DROP TRIGGER IF EXISTS update_ofertas_updated_at ON ofertas;
CREATE TRIGGER update_ofertas_updated_at
  BEFORE UPDATE ON ofertas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNCIÓN: Búsqueda de ofertas
-- ========================================
-- Función optimizada para búsqueda de ofertas con múltiples filtros

CREATE OR REPLACE FUNCTION buscar_ofertas(
  busqueda TEXT DEFAULT NULL,
  filtro_region TEXT DEFAULT NULL,
  filtro_tipo TEXT DEFAULT NULL,
  filtro_categoria TEXT DEFAULT NULL,
  limite INT DEFAULT 20,
  offset_val INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  empleador_id UUID,
  titulo VARCHAR,
  descripcion TEXT,
  empresa VARCHAR,
  ubicacion JSONB,
  tipo VARCHAR,
  categoria VARCHAR,
  salario JSONB,
  requisitos TEXT[],
  beneficios TEXT[],
  activa BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  postulaciones_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.empleador_id,
    o.titulo,
    o.descripcion,
    o.empresa,
    o.ubicacion,
    o.tipo,
    o.categoria,
    o.salario,
    o.requisitos,
    o.beneficios,
    o.activa,
    o.created_at,
    o.updated_at,
    COUNT(p.id) as postulaciones_count
  FROM ofertas o
  LEFT JOIN postulaciones p ON p.oferta_id = o.id
  WHERE o.activa = true
    AND (busqueda IS NULL OR to_tsvector('spanish', o.titulo || ' ' || o.descripcion || ' ' || o.empresa) @@ plainto_tsquery('spanish', busqueda))
    AND (filtro_region IS NULL OR filtro_region = 'todas' OR o.ubicacion->>'region' = filtro_region)
    AND (filtro_tipo IS NULL OR filtro_tipo = 'todos' OR o.tipo = filtro_tipo)
    AND (filtro_categoria IS NULL OR filtro_categoria = 'todas' OR o.categoria = filtro_categoria)
  GROUP BY o.id
  ORDER BY o.created_at DESC
  LIMIT limite
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION buscar_ofertas IS 'Búsqueda optimizada de ofertas con filtros y paginación';

-- ========================================
-- FUNCIÓN: Estadísticas de empleador
-- ========================================
-- Retorna estadísticas agregadas para el dashboard del empleador

CREATE OR REPLACE FUNCTION estadisticas_empleador(empleador_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_ofertas', COUNT(DISTINCT o.id),
    'ofertas_activas', COUNT(DISTINCT o.id) FILTER (WHERE o.activa = true),
    'total_postulaciones', COUNT(p.id),
    'postulaciones_mes_actual', COUNT(p.id) FILTER (
      WHERE p.created_at >= date_trunc('month', CURRENT_DATE)
    )
  )
  INTO stats
  FROM ofertas o
  LEFT JOIN postulaciones p ON p.oferta_id = o.id
  WHERE o.empleador_id = empleador_uuid;

  RETURN stats;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION estadisticas_empleador IS 'Retorna estadísticas del empleador para su dashboard';

-- ========================================
-- DATOS DE EJEMPLO (Opcional - Solo para desarrollo)
-- ========================================
-- Descomenta para insertar datos de prueba

/*
-- Insertar un empleador de ejemplo (requiere que exista el usuario en auth.users)
INSERT INTO empleadores (id, nombre, empresa, telefono)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Reemplazar con UUID real
  'Juan Pérez',
  'TechCorp Chile',
  '+56912345678'
);

-- Insertar ofertas de ejemplo
INSERT INTO ofertas (empleador_id, titulo, descripcion, empresa, ubicacion, tipo, categoria, salario, requisitos, beneficios)
VALUES
(
  '00000000-0000-0000-0000-000000000000',
  'Desarrollador Full Stack',
  'Buscamos desarrollador con experiencia en React y Node.js',
  'TechCorp Chile',
  '{"region": "Metropolitana", "comuna": "Santiago", "lat": -33.4489, "lng": -70.6693}'::jsonb,
  'Full-time',
  'Tecnología',
  '{"minimo": 1500000, "maximo": 2500000, "moneda": "CLP", "periodo": "mes"}'::jsonb,
  ARRAY['React', 'Node.js', 'TypeScript', '3+ años experiencia'],
  ARRAY['Trabajo remoto', 'Seguro médico', 'Capacitaciones']
);
*/

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================
-- Comandos para verificar que todo está correcto

-- Ver todas las tablas creadas
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Ver todas las políticas RLS
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Ver todos los índices
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';

-- ========================================
-- FIN DEL SCHEMA
-- ========================================
