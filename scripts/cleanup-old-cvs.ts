/**
 * Script: Cleanup de CVs Antiguos
 *
 * Elimina postulaciones y archivos CV mayores a 90 días
 * para cumplir con la política de privacidad
 *
 * Uso:
 *   npm run cleanup:cvs
 *   npm run cleanup:cvs -- --dias=60 (personalizado)
 *   npm run cleanup:cvs -- --preview (previsualizar sin eliminar)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DIAS_RETENCION = parseInt(process.env.CV_RETENTION_DAYS || '90');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('   Asegúrate de tener PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

// Cliente de Supabase con permisos de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Postulacion {
  id: string;
  cv_url: string | null;
  nombre: string | null;
  email: string | null;
  created_at: string;
  oferta_id: string;
}

interface CleanupResult {
  postulacionesEliminadas: number;
  archivosEliminados: number;
  archivosFallidos: number;
  errores: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES PRINCIPALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Previsualiza qué postulaciones se eliminarían
 */
async function previewCleanup(diasRetencion: number): Promise<void> {
  console.log('\n📋 PREVISUALIZACIÓN DE LIMPIEZA');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - diasRetencion);

  console.log(`🗓️  Fecha de corte: ${cutoffDate.toISOString()}`);
  console.log(`📅 Días de retención: ${diasRetencion} días\n`);

  // Obtener postulaciones que se eliminarían
  const { data: postulaciones, error } = await supabase
    .from('postulaciones')
    .select('id, nombre, email, created_at, oferta_id, cv_url')
    .lt('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error al obtener postulaciones:', error);
    return;
  }

  if (!postulaciones || postulaciones.length === 0) {
    console.log('✅ No hay postulaciones para eliminar');
    return;
  }

  console.log(`📊 Total a eliminar: ${postulaciones.length} postulaciones\n`);

  // Mostrar muestra de las primeras 5
  console.log('📄 Muestra de postulaciones a eliminar (primeras 5):\n');
  postulaciones.slice(0, 5).forEach((p, idx) => {
    console.log(`   ${idx + 1}. ${p.nombre || 'Sin nombre'} (${p.email || 'Sin email'})`);
    console.log(`      Fecha: ${new Date(p.created_at).toLocaleDateString('es-CL')}`);
    console.log(`      CV: ${p.cv_url ? '✓' : '✗'}\n`);
  });

  if (postulaciones.length > 5) {
    console.log(`   ... y ${postulaciones.length - 5} más\n`);
  }

  console.log('💡 Para ejecutar la limpieza, ejecuta: npm run cleanup:cvs\n');
}

/**
 * Ejecuta la limpieza de CVs antiguos
 */
async function executeCleanup(diasRetencion: number, dryRun: boolean = false): Promise<CleanupResult> {
  const result: CleanupResult = {
    postulacionesEliminadas: 0,
    archivosEliminados: 0,
    archivosFallidos: 0,
    errores: []
  };

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - diasRetencion);

  console.log('\n🧹 LIMPIEZA DE CVS ANTIGUOS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`🗓️  Fecha de corte: ${cutoffDate.toISOString()}`);
  console.log(`📅 Días de retención: ${diasRetencion} días`);
  console.log(`🔍 Modo: ${dryRun ? 'DRY RUN (sin eliminar)' : 'EJECUCIÓN REAL'}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. OBTENER POSTULACIONES A ELIMINAR
  // ─────────────────────────────────────────────────────────────────────────

  const { data: postulaciones, error: fetchError } = await supabase
    .from('postulaciones')
    .select('id, cv_url, nombre, created_at, oferta_id')
    .lt('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error al obtener postulaciones:', fetchError);
    result.errores.push(`Error al obtener postulaciones: ${fetchError.message}`);
    return result;
  }

  if (!postulaciones || postulaciones.length === 0) {
    console.log('✅ No hay postulaciones para eliminar');
    return result;
  }

  console.log(`📊 Total a procesar: ${postulaciones.length} postulaciones\n`);

  if (dryRun) {
    console.log('⚠️  DRY RUN: No se eliminará nada');
    result.postulacionesEliminadas = postulaciones.length;
    result.archivosEliminados = postulaciones.filter(p => p.cv_url).length;
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. ELIMINAR ARCHIVOS CV DEL STORAGE
  // ─────────────────────────────────────────────────────────────────────────

  console.log('🗑️  Eliminando archivos CV del Storage...\n');

  for (const postulacion of postulaciones) {
    if (!postulacion.cv_url) continue;

    try {
      // Extraer el path del archivo desde la URL
      // cv_url puede ser: "postulaciones/{oferta_id}/{filename}" o path completo
      const cvPath = postulacion.cv_url;

      const { error: deleteError } = await supabase.storage
        .from('cvs')
        .remove([cvPath]);

      if (deleteError) {
        console.warn(`   ⚠️  Error eliminando CV ${cvPath}: ${deleteError.message}`);
        result.archivosFallidos++;
        result.errores.push(`CV ${cvPath}: ${deleteError.message}`);
      } else {
        console.log(`   ✓ Eliminado: ${cvPath}`);
        result.archivosEliminados++;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`   ⚠️  Error procesando CV: ${errorMsg}`);
      result.archivosFallidos++;
      result.errores.push(errorMsg);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. ELIMINAR REGISTROS DE POSTULACIONES
  // ─────────────────────────────────────────────────────────────────────────

  console.log('\n🗑️  Eliminando registros de postulaciones...\n');

  const { error: deleteError } = await supabase
    .from('postulaciones')
    .delete()
    .lt('created_at', cutoffDate.toISOString());

  if (deleteError) {
    console.error('❌ Error eliminando postulaciones:', deleteError);
    result.errores.push(`Error eliminando postulaciones: ${deleteError.message}`);
    return result;
  }

  result.postulacionesEliminadas = postulaciones.length;
  console.log(`   ✓ Eliminadas ${postulaciones.length} postulaciones`);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. REGISTRAR EN LOG
  // ─────────────────────────────────────────────────────────────────────────

  const { error: logError } = await supabase
    .from('cleanup_logs')
    .insert({
      executed_at: new Date().toISOString(),
      cutoff_date: cutoffDate.toISOString(),
      postulaciones_eliminadas: result.postulacionesEliminadas,
      archivos_eliminados: result.archivosEliminados,
      archivos_fallidos: result.archivosFallidos,
      dias_retencion: diasRetencion,
      error_message: result.errores.length > 0 ? result.errores.join('; ') : null
    });

  if (logError) {
    console.warn('\n⚠️  Error registrando log:', logError);
  }

  return result;
}

/**
 * Muestra estadísticas de limpiezas anteriores
 */
async function showStats(ultimosDias: number = 30): Promise<void> {
  console.log('\n📊 ESTADÍSTICAS DE LIMPIEZAS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - ultimosDias);

  const { data: logs, error } = await supabase
    .from('cleanup_logs')
    .select('*')
    .gte('executed_at', cutoffDate.toISOString())
    .order('executed_at', { ascending: false });

  if (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    return;
  }

  if (!logs || logs.length === 0) {
    console.log(`No hay logs de limpieza en los últimos ${ultimosDias} días`);
    return;
  }

  const totalPostulaciones = logs.reduce((sum, log) => sum + log.postulaciones_eliminadas, 0);
  const totalArchivos = logs.reduce((sum, log) => sum + log.archivos_eliminados, 0);
  const totalFallidos = logs.reduce((sum, log) => sum + log.archivos_fallidos, 0);

  console.log(`📅 Período: Últimos ${ultimosDias} días`);
  console.log(`🔄 Total ejecuciones: ${logs.length}`);
  console.log(`📄 Total postulaciones eliminadas: ${totalPostulaciones}`);
  console.log(`📎 Total archivos eliminados: ${totalArchivos}`);
  console.log(`❌ Total archivos fallidos: ${totalFallidos}\n`);

  console.log('Últimas 5 ejecuciones:\n');
  logs.slice(0, 5).forEach((log, idx) => {
    const fecha = new Date(log.executed_at).toLocaleString('es-CL');
    console.log(`   ${idx + 1}. ${fecha}`);
    console.log(`      Postulaciones: ${log.postulaciones_eliminadas}`);
    console.log(`      Archivos: ${log.archivos_eliminados}`);
    console.log(`      Fallidos: ${log.archivos_fallidos}\n`);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview');
  const isDryRun = args.includes('--dry-run');
  const showStatsFlag = args.includes('--stats');

  // Parse días
  const diasArg = args.find(arg => arg.startsWith('--dias='));
  const dias = diasArg ? parseInt(diasArg.split('=')[1]) : DIAS_RETENCION;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       CLEANUP AUTOMÁTICO DE CVS - Portal de Empleos       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    if (showStatsFlag) {
      await showStats(30);
    } else if (isPreview) {
      await previewCleanup(dias);
    } else {
      const result = await executeCleanup(dias, isDryRun);

      console.log('\n\n✅ LIMPIEZA COMPLETADA');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log(`📄 Postulaciones eliminadas: ${result.postulacionesEliminadas}`);
      console.log(`📎 Archivos eliminados: ${result.archivosEliminados}`);
      console.log(`❌ Archivos fallidos: ${result.archivosFallidos}\n`);

      if (result.errores.length > 0) {
        console.log('⚠️  Errores encontrados:');
        result.errores.slice(0, 5).forEach(err => {
          console.log(`   - ${err}`);
        });
        if (result.errores.length > 5) {
          console.log(`   ... y ${result.errores.length - 5} más\n`);
        }
      }

      console.log('💡 Para ver estadísticas, ejecuta: npm run cleanup:cvs -- --stats\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
