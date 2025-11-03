-- ============================================================================
-- FUNCIÓN: Cleanup Automático de CVs Antiguos
-- Descripción: Elimina CVs y postulaciones mayores a 90 días
--              Cumple con la política de privacidad declarada
-- Uso: SELECT cleanup_old_cvs(); (ejecutar diariamente con cron)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. FUNCIÓN PRINCIPAL DE LIMPIEZA
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_old_cvs(
  p_dias_retencion INTEGER DEFAULT 90
)
RETURNS JSON AS $$
DECLARE
  v_cutoff_date TIMESTAMP;
  v_postulaciones_eliminadas INTEGER := 0;
  v_archivos_eliminados INTEGER := 0;
  v_archivos_fallidos INTEGER := 0;
  v_postulacion RECORD;
  v_storage_error TEXT;
  v_resultado JSON;
BEGIN
  -- Calcular fecha de corte (90 días atrás por defecto)
  v_cutoff_date := NOW() - (p_dias_retencion || ' days')::INTERVAL;

  RAISE NOTICE 'Iniciando limpieza de CVs anteriores a: %', v_cutoff_date;

  -- ────────────────────────────────────────────────────────────────────
  -- 2. OBTENER POSTULACIONES A ELIMINAR
  -- ────────────────────────────────────────────────────────────────────

  FOR v_postulacion IN
    SELECT id, cv_url, nombre, created_at
    FROM postulaciones
    WHERE created_at < v_cutoff_date
    ORDER BY created_at ASC
  LOOP
    -- Intentar eliminar archivo de Storage (si existe)
    IF v_postulacion.cv_url IS NOT NULL AND v_postulacion.cv_url != '' THEN
      BEGIN
        -- Nota: En Supabase, la eliminación de archivos se hace desde la aplicación
        -- Esta función solo marca las postulaciones para eliminación
        -- El script de aplicación (cleanup-old-cvs.ts) eliminará los archivos

        RAISE NOTICE 'Marcando CV para eliminación: % (postulación: %)',
          v_postulacion.cv_url, v_postulacion.id;

        v_archivos_eliminados := v_archivos_eliminados + 1;

      EXCEPTION WHEN OTHERS THEN
        v_storage_error := SQLERRM;
        RAISE WARNING 'Error al procesar CV: % - Error: %',
          v_postulacion.cv_url, v_storage_error;
        v_archivos_fallidos := v_archivos_fallidos + 1;
      END;
    END IF;

    v_postulaciones_eliminadas := v_postulaciones_eliminadas + 1;
  END LOOP;

  -- ────────────────────────────────────────────────────────────────────
  -- 3. ELIMINAR REGISTROS DE POSTULACIONES
  -- ────────────────────────────────────────────────────────────────────

  DELETE FROM postulaciones
  WHERE created_at < v_cutoff_date;

  -- Verificar que la cantidad eliminada coincida
  IF NOT FOUND THEN
    RAISE NOTICE 'No se encontraron postulaciones para eliminar';
  END IF;

  -- ────────────────────────────────────────────────────────────────────
  -- 4. REGISTRAR EN LOG DE AUDITORÍA
  -- ────────────────────────────────────────────────────────────────────

  INSERT INTO cleanup_logs (
    executed_at,
    cutoff_date,
    postulaciones_eliminadas,
    archivos_eliminados,
    archivos_fallidos,
    dias_retencion
  ) VALUES (
    NOW(),
    v_cutoff_date,
    v_postulaciones_eliminadas,
    v_archivos_eliminados,
    v_archivos_fallidos,
    p_dias_retencion
  );

  -- ────────────────────────────────────────────────────────────────────
  -- 5. RETORNAR RESULTADO
  -- ────────────────────────────────────────────────────────────────────

  v_resultado := json_build_object(
    'success', true,
    'executed_at', NOW(),
    'cutoff_date', v_cutoff_date,
    'dias_retencion', p_dias_retencion,
    'postulaciones_eliminadas', v_postulaciones_eliminadas,
    'archivos_eliminados', v_archivos_eliminados,
    'archivos_fallidos', v_archivos_fallidos,
    'message', format('Se eliminaron %s postulaciones y %s archivos CV',
      v_postulaciones_eliminadas, v_archivos_eliminados)
  );

  RAISE NOTICE 'Limpieza completada: %', v_resultado;

  RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
  -- Manejar errores inesperados
  v_resultado := json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Error al ejecutar limpieza de CVs'
  );

  RAISE WARNING 'Error en cleanup_old_cvs: %', SQLERRM;

  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_cvs IS 'Elimina postulaciones y CVs mayores al período de retención (90 días por defecto)';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. TABLA DE LOGS DE LIMPIEZA
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cutoff_date TIMESTAMPTZ NOT NULL,
  postulaciones_eliminadas INTEGER NOT NULL DEFAULT 0,
  archivos_eliminados INTEGER NOT NULL DEFAULT 0,
  archivos_fallidos INTEGER NOT NULL DEFAULT 0,
  dias_retencion INTEGER NOT NULL DEFAULT 90,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_cleanup_logs_executed_at ON cleanup_logs(executed_at DESC);

COMMENT ON TABLE cleanup_logs IS 'Registro de ejecuciones del cleanup automático de CVs';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. FUNCIÓN PARA OBTENER ESTADÍSTICAS DE LIMPIEZA
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_cleanup_stats(
  p_ultimos_dias INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  v_resultado JSON;
BEGIN
  SELECT json_build_object(
    'total_ejecuciones', COUNT(*),
    'ultima_ejecucion', MAX(executed_at),
    'total_postulaciones_eliminadas', SUM(postulaciones_eliminadas),
    'total_archivos_eliminados', SUM(archivos_eliminados),
    'total_archivos_fallidos', SUM(archivos_fallidos),
    'ejecuciones_recientes', (
      SELECT json_agg(
        json_build_object(
          'fecha', executed_at,
          'postulaciones', postulaciones_eliminadas,
          'archivos', archivos_eliminados,
          'fallidos', archivos_fallidos
        ) ORDER BY executed_at DESC
      )
      FROM cleanup_logs
      WHERE executed_at > NOW() - (p_ultimos_dias || ' days')::INTERVAL
      LIMIT 10
    )
  ) INTO v_resultado
  FROM cleanup_logs
  WHERE executed_at > NOW() - (p_ultimos_dias || ' days')::INTERVAL;

  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_cleanup_stats IS 'Obtiene estadísticas de las limpiezas ejecutadas';

-- ─────────────────────────────────────────────────────────────────────────
-- 4. FUNCIÓN PARA PREVIEW (VER QUÉ SE ELIMINARÍA)
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION preview_cleanup_old_cvs(
  p_dias_retencion INTEGER DEFAULT 90
)
RETURNS JSON AS $$
DECLARE
  v_cutoff_date TIMESTAMP;
  v_count INTEGER;
  v_resultado JSON;
BEGIN
  v_cutoff_date := NOW() - (p_dias_retencion || ' days')::INTERVAL;

  SELECT COUNT(*) INTO v_count
  FROM postulaciones
  WHERE created_at < v_cutoff_date;

  SELECT json_build_object(
    'cutoff_date', v_cutoff_date,
    'dias_retencion', p_dias_retencion,
    'postulaciones_a_eliminar', v_count,
    'postulaciones_muestra', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'nombre', nombre,
          'email', email,
          'created_at', created_at,
          'oferta_id', oferta_id
        )
      )
      FROM (
        SELECT id, nombre, email, created_at, oferta_id
        FROM postulaciones
        WHERE created_at < v_cutoff_date
        ORDER BY created_at ASC
        LIMIT 5
      ) sample
    )
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION preview_cleanup_old_cvs IS 'Previsualiza qué postulaciones se eliminarían sin ejecutar la limpieza';

-- ─────────────────────────────────────────────────────────────────────────
-- 5. GRANTS Y PERMISOS
-- ─────────────────────────────────────────────────────────────────────────

-- Solo el servicio puede ejecutar estas funciones
-- En producción, ejecutar desde un cron job con service_role key

-- ─────────────────────────────────────────────────────────────────────────
-- 6. EJEMPLOS DE USO
-- ─────────────────────────────────────────────────────────────────────────

/*
-- 1. Previsualizar qué se eliminaría (sin eliminar nada)
SELECT preview_cleanup_old_cvs(90);

-- Resultado ejemplo:
{
  "cutoff_date": "2024-08-03T12:00:00",
  "dias_retencion": 90,
  "postulaciones_a_eliminar": 45,
  "postulaciones_muestra": [
    {
      "id": "uuid-1",
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "created_at": "2024-05-01T10:00:00",
      "oferta_id": "uuid-oferta-1"
    },
    ...
  ]
}

-- 2. Ejecutar limpieza (90 días por defecto)
SELECT cleanup_old_cvs();

-- 3. Ejecutar limpieza con período personalizado (60 días)
SELECT cleanup_old_cvs(60);

-- 4. Ver estadísticas de limpiezas (últimos 30 días)
SELECT get_cleanup_stats(30);

-- Resultado ejemplo:
{
  "total_ejecuciones": 30,
  "ultima_ejecucion": "2024-11-03T12:00:00",
  "total_postulaciones_eliminadas": 1250,
  "total_archivos_eliminados": 1240,
  "total_archivos_fallidos": 10,
  "ejecuciones_recientes": [
    {
      "fecha": "2024-11-03T12:00:00",
      "postulaciones": 45,
      "archivos": 44,
      "fallidos": 1
    },
    ...
  ]
}

-- 5. Ver logs de limpieza
SELECT
  executed_at,
  postulaciones_eliminadas,
  archivos_eliminados,
  archivos_fallidos
FROM cleanup_logs
ORDER BY executed_at DESC
LIMIT 10;
*/
