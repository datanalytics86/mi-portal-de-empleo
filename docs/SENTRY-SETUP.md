# Sentry - Monitoring y Error Tracking

## 📋 Descripción

Integración de Sentry para monitoring, error tracking y debugging en producción.

## 🎯 Objetivos

- **Error Tracking:** Capturar errores automáticamente
- **Performance Monitoring:** Rastrear performance de la aplicación
- **Session Replay:** Ver reproducciones de sesiones con errores
- **Alertas:** Notificaciones automáticas de errores críticos

## 🚀 Setup

### 1. Crear Cuenta en Sentry

1. Ir a [sentry.io](https://sentry.io)
2. Crear cuenta gratuita
3. Crear nuevo proyecto → Seleccionar "Astro"
4. Copiar el DSN proporcionado

### 2. Configurar Variables de Entorno

Agregar en `.env`:

```env
# Sentry (Opcional - para monitoring en producción)
PUBLIC_SENTRY_DSN=https://xxxxx@o0000.ingest.sentry.io/0000000
PUBLIC_APP_VERSION=1.0.0
```

**Importante:**
- DSN es **público** (puede estar en el cliente)
- Sin DSN, Sentry está deshabilitado (desarrollo local)
- Configurar en Vercel/producción para activar

### 3. Inicializar en la Aplicación

El Sentry ya está configurado en `src/lib/sentry.ts`. Para activarlo, agregar en `src/pages/_app.astro` o layout principal:

```astro
---
import { initSentry } from '../lib/sentry';

// Inicializar Sentry si está en producción
if (import.meta.env.PROD) {
  initSentry();
}
---
```

O crear un archivo de inicialización:

**`src/instrumentation.ts`** (si Astro lo soporta):
```typescript
import { initSentry } from './lib/sentry';

initSentry();
```

## 📊 Uso en el Código

### Capturar Errores Automáticamente

```typescript
import { captureException } from '../lib/sentry';

try {
  await uploadCV(file);
} catch (error) {
  // Capturar y enviar a Sentry
  captureException(error, {
    context: 'Upload CV',
    extra: {
      fileSize: file.size,
      fileName: file.name
    },
    level: 'error'
  });

  // Mostrar error al usuario
  throw error;
}
```

### Capturar Mensajes (No Errores)

```typescript
import { captureMessage } from '../lib/sentry';

// Warning
captureMessage(
  'Usuario intentó subir archivo muy grande',
  'warning',
  {
    fileSize: 10000000,
    limit: 5000000
  }
);

// Info
captureMessage(
  'Cleanup de CVs ejecutado exitosamente',
  'info',
  {
    deletedCount: 45
  }
);
```

### Agregar Contexto de Usuario

```typescript
import { setUser, clearUser } from '../lib/sentry';

// Al hacer login
setUser({
  id: empleador.id,
  email: empleador.email
});

// Al hacer logout
clearUser();
```

### Agregar Breadcrumbs (Contexto)

```typescript
import { addBreadcrumb } from '../lib/sentry';

// Útil para tracking de acciones del usuario
addBreadcrumb({
  message: 'Usuario comenzó a llenar formulario',
  category: 'postulacion',
  level: 'info',
  data: {
    ofertaId: '123'
  }
});

addBreadcrumb({
  message: 'Usuario seleccionó archivo CV',
  category: 'upload',
  data: {
    fileSize: 2500000
  }
});
```

### Wrapper para Funciones

```typescript
import { withErrorTracking } from '../lib/sentry';

// Función original
async function uploadCV(file: File) {
  // ... código
}

// Versión con tracking automático
const uploadCVWithTracking = withErrorTracking(
  uploadCV,
  'Upload CV'
);

// Usar
await uploadCVWithTracking(file);
// Si falla, error se envía automáticamente a Sentry
```

## 🔧 Configuración Avanzada

### Performance Monitoring

En `src/lib/sentry.ts`:

```typescript
Sentry.init({
  dsn: SENTRY_DSN,

  // Traces
  tracesSampleRate: 0.1, // 10% de transacciones

  // Custom traces
  integrations: [
    Sentry.browserTracingIntegration({
      tracingOrigins: [
        'localhost',
        'tu-dominio.vercel.app'
      ]
    })
  ]
});
```

### Session Replay

Ya configurado por defecto:
- 10% de sesiones normales
- 100% de sesiones con errores

Para ajustar:

```typescript
Sentry.init({
  replaysSessionSampleRate: 0.1, // 10%
  replaysOnErrorSampleRate: 1.0, // 100%
});
```

### Filtrar Información Sensible

Ya implementado en `beforeSend`:

```typescript
beforeSend(event, hint) {
  // Filtrar datos sensibles
  if (event.request) {
    delete event.request.cookies;

    // Filtrar query params
    const sensitiveParams = ['token', 'password'];
    // ... filtrado
  }

  return event;
}
```

## 📈 Monitoring en Producción

### Configurar Alertas

1. Ir a Sentry Dashboard
2. Settings → Alerts
3. Crear alerta:

**Alerta de Error Crítico:**
- Condition: Error count > 10 in 5 minutes
- Action: Email + Slack
- Filters: environment:production, level:error

**Alerta de Performance:**
- Condition: Response time > 3s
- Action: Email

**Alerta de Rate:**
- Condition: Error rate > 5%
- Action: Email + PagerDuty

### Dashboard Recomendado

Crear dashboard con:
- Total de errores (últimas 24h)
- Errores por endpoint
- Top 5 errores más frecuentes
- Response time promedio
- Tasa de error (%)

### Issues Más Comunes

Monitorear:
1. Errores de subida de CV
2. Errores de autenticación
3. Timeouts de API
4. Errores de Storage
5. Errores de validación

## 🔍 Debugging con Sentry

### Ver Detalle de Error

En Sentry Dashboard:
1. Ver error específico
2. Stack trace completo
3. Breadcrumbs (acciones del usuario)
4. Device/Browser info
5. Session Replay (si disponible)

### Filtros Útiles

```
# Errores de producción
environment:production

# Errores de endpoint específico
transaction:"/api/postular"

# Errores de usuario específico
user.id:"123"

# Errores críticos
level:error

# Últimas 24 horas
age:-24h
```

### Buscar Patrones

```
# Errores de subida de CV
message:"Failed to upload"

# Errores de Storage
message:"storage"

# Errores de rate limiting
message:"rate limit"
```

## 💰 Planes y Pricing

### Free Tier (Suficiente para MVP)
- 5.000 errores/mes
- 1 usuario
- 30 días de retención
- Alertas básicas

### Team Plan ($26/mes)
- 50.000 errores/mes
- Usuarios ilimitados
- 90 días de retención
- Alertas avanzadas
- Session Replay

### Business Plan ($80/mes)
- 100.000 errores/mes
- SLA
- Soporte prioritario

## 🎓 Best Practices

### 1. No Capturar TODO

```typescript
// ❌ Malo - capturar errores esperados
try {
  const user = await getUser(id);
} catch (error) {
  captureException(error); // No hacer esto
  return null;
}

// ✅ Bueno - solo errores inesperados
try {
  const user = await getUser(id);
} catch (error) {
  if (error.code === 'USER_NOT_FOUND') {
    return null; // Esperado, no reportar
  }
  captureException(error); // Inesperado, reportar
  throw error;
}
```

### 2. Agregar Contexto

```typescript
// ❌ Malo - sin contexto
captureException(error);

// ✅ Bueno - con contexto
captureException(error, {
  context: 'Upload CV en oferta X',
  extra: {
    ofertaId: '123',
    fileSize: file.size,
    userId: user.id
  }
});
```

### 3. Usar Breadcrumbs

```typescript
// Agregar breadcrumbs antes de operaciones críticas
addBreadcrumb({
  message: 'Iniciando subida de CV',
  category: 'upload'
});

try {
  await uploadCV(file);

  addBreadcrumb({
    message: 'CV subido exitosamente',
    level: 'info'
  });
} catch (error) {
  // Breadcrumbs se incluirán en el error report
  captureException(error);
}
```

### 4. Configurar Releases

```bash
# En CI/CD, crear release
sentry-cli releases new 1.0.1
sentry-cli releases set-commits 1.0.1 --auto
sentry-cli releases finalize 1.0.1

# Asociar errores con release específico
PUBLIC_APP_VERSION=1.0.1
```

## 🧪 Testing

### Test en Desarrollo

```typescript
// Forzar error de prueba
import { captureMessage } from '../lib/sentry';

captureMessage('Test de Sentry', 'info', {
  test: true
});
```

### Test en Producción

1. Deploy a producción
2. Generar error intencional (404, error de form, etc.)
3. Verificar en Sentry Dashboard que apareció
4. Verificar que llegó alerta (email/Slack)

## 🔗 Referencias

- [Sentry Astro Docs](https://docs.sentry.io/platforms/javascript/guides/astro/)
- [Sentry JavaScript SDK](https://docs.sentry.io/platforms/javascript/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

## 🐛 Troubleshooting

### Errores no aparecen en Sentry

**Solución:**
1. Verificar que DSN está configurado
2. Verificar que `initSentry()` se ejecuta
3. Verificar en console: "Sentry initialized"
4. Verificar que error no está en `ignoreErrors`
5. Verificar quota de Sentry (free tier)

### "Sentry is not defined"

**Solución:**
```typescript
import * as Sentry from '@sentry/astro';
```

### Datos sensibles en errores

**Solución:**
- Configurar `beforeSend` (ya implementado)
- Usar `maskAllText` en Replay
- Filtrar query params sensibles

---

**Última actualización:** Noviembre 2024
**Versión:** 1.0.0
