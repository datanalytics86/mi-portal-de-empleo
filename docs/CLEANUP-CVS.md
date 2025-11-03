# Cleanup Automático de CVs

## 📋 Descripción

Sistema automático para eliminar CVs y postulaciones mayores a 90 días, cumpliendo con la política de privacidad del portal.

## 🎯 Objetivo

- **Retención de datos:** 90 días (configurable)
- **Cumplimiento:** Política de privacidad declarada
- **Automatización:** Ejecución diaria mediante cron job
- **Seguridad:** Solo elimina datos vencidos

## 📂 Componentes

### 1. Función SQL (`supabase/functions/cleanup-old-cvs.sql`)

Funciones de Supabase para:
- `cleanup_old_cvs(dias)` - Ejecuta la limpieza
- `preview_cleanup_old_cvs(dias)` - Previsualiza sin eliminar
- `get_cleanup_stats(dias)` - Estadísticas de ejecuciones
- Tabla `cleanup_logs` - Registro de auditoría

### 2. Script TypeScript (`scripts/cleanup-old-cvs.ts`)

Script Node.js que:
- Obtiene postulaciones antiguas de la base de datos
- Elimina archivos CV del Storage de Supabase
- Elimina registros de postulaciones
- Registra la ejecución en logs de auditoría

## 🚀 Uso

### Instalación de Dependencias

```bash
npm install
```

### Comandos Disponibles

```bash
# Previsualizar qué se eliminaría (sin eliminar)
npm run cleanup:cvs:preview

# Ejecutar limpieza (90 días por defecto)
npm run cleanup:cvs

# Ejecutar con período personalizado (60 días)
npm run cleanup:cvs -- --dias=60

# Ver estadísticas de limpiezas anteriores
npm run cleanup:cvs:stats

# Dry run (simular sin eliminar)
npm run cleanup:cvs -- --dry-run
```

### Ejemplos

#### 1. Previsualizar antes de ejecutar

```bash
$ npm run cleanup:cvs:preview

╔════════════════════════════════════════════════════════════╗
║       CLEANUP AUTOMÁTICO DE CVS - Portal de Empleos       ║
╚════════════════════════════════════════════════════════════╝

📋 PREVISUALIZACIÓN DE LIMPIEZA
═══════════════════════════════════════════════════════════════

🗓️  Fecha de corte: 2024-08-03T12:00:00.000Z
📅 Días de retención: 90 días

📊 Total a eliminar: 45 postulaciones

📄 Muestra de postulaciones a eliminar (primeras 5):

   1. Juan Pérez (juan@example.com)
      Fecha: 1/5/2024
      CV: ✓

   2. María González (maria@example.com)
      Fecha: 3/5/2024
      CV: ✓

   ... y 40 más

💡 Para ejecutar la limpieza, ejecuta: npm run cleanup:cvs
```

#### 2. Ejecutar limpieza

```bash
$ npm run cleanup:cvs

╔════════════════════════════════════════════════════════════╗
║       CLEANUP AUTOMÁTICO DE CVS - Portal de Empleos       ║
╚════════════════════════════════════════════════════════════╝

🧹 LIMPIEZA DE CVS ANTIGUOS
═══════════════════════════════════════════════════════════════

🗓️  Fecha de corte: 2024-08-03T12:00:00.000Z
📅 Días de retención: 90 días
🔍 Modo: EJECUCIÓN REAL

📊 Total a procesar: 45 postulaciones

🗑️  Eliminando archivos CV del Storage...

   ✓ Eliminado: postulaciones/uuid-1/cv_juan_perez.pdf
   ✓ Eliminado: postulaciones/uuid-2/cv_maria_gonzalez.pdf
   ...

🗑️  Eliminando registros de postulaciones...

   ✓ Eliminadas 45 postulaciones


✅ LIMPIEZA COMPLETADA
═══════════════════════════════════════════════════════════════

📄 Postulaciones eliminadas: 45
📎 Archivos eliminados: 44
❌ Archivos fallidos: 1

💡 Para ver estadísticas, ejecuta: npm run cleanup:cvs -- --stats
```

#### 3. Ver estadísticas

```bash
$ npm run cleanup:cvs:stats

╔════════════════════════════════════════════════════════════╗
║       CLEANUP AUTOMÁTICO DE CVS - Portal de Empleos       ║
╚════════════════════════════════════════════════════════════╝

📊 ESTADÍSTICAS DE LIMPIEZAS
═══════════════════════════════════════════════════════════════

📅 Período: Últimos 30 días
🔄 Total ejecuciones: 30
📄 Total postulaciones eliminadas: 1.250
📎 Total archivos eliminados: 1.240
❌ Total archivos fallidos: 10

Últimas 5 ejecuciones:

   1. 3/11/2024, 12:00:00
      Postulaciones: 45
      Archivos: 44
      Fallidos: 1

   2. 2/11/2024, 12:00:00
      Postulaciones: 38
      Archivos: 38
      Fallidos: 0

   ...
```

## ⚙️ Configuración

### Variables de Entorno

Agregar en `.env`:

```env
# Cleanup de CVs
CV_RETENTION_DAYS=90  # Días de retención (opcional, default: 90)

# Supabase (requeridas)
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### Ejecutar Función SQL en Supabase

1. Ir al SQL Editor en Supabase Dashboard
2. Copiar y ejecutar el contenido de `supabase/functions/cleanup-old-cvs.sql`
3. Esto creará:
   - Función `cleanup_old_cvs()`
   - Tabla `cleanup_logs`
   - Funciones auxiliares de preview y estadísticas

## 🔄 Automatización con Cron

### Opción 1: Cron Job en Servidor (Recomendado para VPS)

Agregar al crontab del servidor:

```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar diariamente a las 3 AM
0 3 * * * cd /ruta/al/proyecto && npm run cleanup:cvs >> /var/log/cv-cleanup.log 2>&1
```

### Opción 2: GitHub Actions (Recomendado para Vercel/Serverless)

Crear `.github/workflows/cleanup-cvs.yml`:

```yaml
name: Cleanup Old CVs

on:
  schedule:
    # Ejecutar diariamente a las 3 AM UTC
    - cron: '0 3 * * *'
  workflow_dispatch: # Permitir ejecución manual

jobs:
  cleanup:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run cleanup
        env:
          PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          CV_RETENTION_DAYS: 90
        run: npm run cleanup:cvs
```

**Configurar secrets en GitHub:**
1. Ir a Settings → Secrets and variables → Actions
2. Agregar:
   - `PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Opción 3: Vercel Cron Jobs (Próximamente)

Agregar en `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/cleanup-cvs",
    "schedule": "0 3 * * *"
  }]
}
```

Crear endpoint `/api/cron/cleanup-cvs.ts` que ejecute el script.

### Opción 4: Supabase Edge Functions + pg_cron

Para ejecutar directamente en Supabase:

```sql
-- Habilitar extensión pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar ejecución diaria a las 3 AM
SELECT cron.schedule(
  'cleanup-old-cvs-daily',
  '0 3 * * *',
  $$SELECT cleanup_old_cvs(90);$$
);

-- Ver jobs programados
SELECT * FROM cron.job;

-- Eliminar job (si es necesario)
SELECT cron.unschedule('cleanup-old-cvs-daily');
```

**Nota:** `pg_cron` puede no estar disponible en el tier gratuito de Supabase.

## 📊 Monitoring

### Revisar Logs Manualmente

```sql
-- Ver últimas 10 ejecuciones
SELECT
  executed_at,
  postulaciones_eliminadas,
  archivos_eliminados,
  archivos_fallidos,
  error_message
FROM cleanup_logs
ORDER BY executed_at DESC
LIMIT 10;
```

### Alertas Automáticas (Opcional)

Configurar en Sentry o monitoring service:
- Alerta si `archivos_fallidos > 10`
- Alerta si no se ejecutó en las últimas 25 horas
- Alerta si hay errores en `error_message`

## 🔒 Seguridad

- ✅ Usa `SUPABASE_SERVICE_ROLE_KEY` (nunca `ANON_KEY`)
- ✅ Solo ejecuta en servidor (nunca en cliente)
- ✅ Registra todas las operaciones en `cleanup_logs`
- ✅ Permite preview antes de ejecutar
- ✅ Respeta período de retención configurable

## 🧪 Testing

### Test Manual

1. Crear postulación de prueba con fecha antigua:

```sql
INSERT INTO postulaciones (
  oferta_id,
  nombre,
  email,
  telefono,
  cv_url,
  created_at
) VALUES (
  'uuid-oferta-existente',
  'Test Usuario',
  'test@example.com',
  '+56912345678',
  'test/cv-antiguo.pdf',
  NOW() - INTERVAL '100 days' -- 100 días atrás
);
```

2. Ejecutar preview:

```bash
npm run cleanup:cvs:preview
```

3. Verificar que aparece en la lista

4. Ejecutar cleanup:

```bash
npm run cleanup:cvs
```

5. Verificar que se eliminó

### Test Automatizado

```bash
# TODO: Implementar tests con Vitest
npm run test:cleanup
```

## 📝 Notas

- **Período por defecto:** 90 días (configurable via `CV_RETENTION_DAYS`)
- **Retención mínima recomendada:** 30 días
- **Backup:** Considerar hacer backup de postulaciones antes de ejecutar
- **Reversión:** No es posible recuperar datos eliminados

## 🐛 Troubleshooting

### Error: "Variables de entorno no configuradas"

**Solución:** Verificar que `.env` contiene:
```env
PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Error: "relation cleanup_logs does not exist"

**Solución:** Ejecutar el script SQL en Supabase:
```bash
supabase/functions/cleanup-old-cvs.sql
```

### Archivos no se eliminan del Storage

**Solución:** Verificar políticas de Storage en Supabase:
- Bucket `cvs` debe permitir eliminación con service_role key
- Path del CV debe ser correcto

### Cron job no se ejecuta

**Solución:**
- Verificar logs del sistema: `tail -f /var/log/cv-cleanup.log`
- Verificar crontab: `crontab -l`
- Verificar permisos del script
- Verificar que las variables de entorno están disponibles

## 🔗 Referencias

- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [PostgreSQL pg_cron](https://github.com/citusdata/pg_cron)
- [GitHub Actions Cron](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

---

**Última actualización:** Noviembre 2024
**Versión:** 1.0.0
