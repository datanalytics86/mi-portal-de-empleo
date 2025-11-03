/**
 * Sentry Integration - Error Monitoring
 *
 * Captura y reporta errores automáticamente a Sentry
 * para monitoring y debugging en producción
 *
 * NOTA: Requiere instalar dependencia: npm install @sentry/astro
 */

import * as Sentry from '@sentry/astro';

// TypeScript types para beforeSend
type SentryEvent = any;
type SentryHint = any;

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const SENTRY_DSN = import.meta.env.PUBLIC_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE; // 'development' | 'production'
const APP_VERSION = import.meta.env.PUBLIC_APP_VERSION || '1.0.0';

/**
 * Inicializa Sentry para error tracking
 * Solo se activa si SENTRY_DSN está configurado
 */
export function initSentry() {
  // Solo inicializar si DSN está configurado
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN no configurado, monitoring deshabilitado');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `portal-empleos-chile@${APP_VERSION}`,

    // Configuración de sampling
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0, // 10% en prod, 100% en dev

    // Configuración de sesiones
    replaysSessionSampleRate: 0.1, // 10% de sesiones
    replaysOnErrorSampleRate: 1.0, // 100% cuando hay error

    // Integrations
    integrations: [
      // Replay para ver sesiones de usuario
      Sentry.replayIntegration({
        maskAllText: true, // Ocultar texto sensible
        blockAllMedia: true, // Bloquear imágenes/videos
      }),

      // Breadcrumbs para contexto adicional
      Sentry.breadcrumbsIntegration({
        console: true, // Capturar console logs
        dom: true, // Capturar eventos DOM
        fetch: true, // Capturar requests fetch
        history: true, // Capturar navegación
        xhr: true, // Capturar requests XHR
      }),
    ],

    // Filtros de errores
    ignoreErrors: [
      // Errores de navegadores viejos
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',

      // Errores de red que no podemos controlar
      'NetworkError when attempting to fetch resource',
      'Load failed',

      // Errores de extensiones de navegador
      'chrome-extension://',
      'moz-extension://',

      // Errores de scripts externos
      'Script error.',
    ],

    // Antes de enviar evento
    beforeSend(event: SentryEvent, _hint: SentryHint) {
      // Filtrar información sensible
      if (event.request) {
        // Remover headers sensibles
        delete event.request.cookies;

        // Remover query params sensibles
        if (event.request.query_string) {
          const sensitiveParams = ['token', 'password', 'api_key', 'secret'];
          sensitiveParams.forEach(param => {
            if (event.request?.query_string?.includes(param)) {
              event.request.query_string = '[FILTERED]';
            }
          });
        }
      }

      // Agregar contexto adicional
      if (event.user) {
        // Solo incluir info no sensible
        event.user.ip_address = '{{auto}}'; // Sentry auto-detecta
      }

      return event;
    },
  });

  console.log(`[Sentry] Inicializado en modo ${ENVIRONMENT}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS PARA CAPTURAR ERRORES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Captura una excepción y la envía a Sentry
 *
 * @example
 * try {
 *   await uploadCV(file);
 * } catch (error) {
 *   captureException(error, {
 *     context: 'Upload CV',
 *     extra: { fileSize: file.size }
 *   });
 * }
 */
export function captureException(
  error: unknown,
  options?: {
    context?: string;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) {
  if (!SENTRY_DSN) return;

  Sentry.withScope(scope => {
    if (options?.context) {
      scope.setContext('error_context', {
        description: options.context
      });
    }

    if (options?.extra) {
      Object.entries(options.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (options?.level) {
      scope.setLevel(options.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Captura un mensaje (no error) en Sentry
 *
 * @example
 * captureMessage('Usuario intentó subir archivo muy grande', 'warning', {
 *   fileSize: 10000000,
 *   limit: 5000000
 * });
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  extra?: Record<string, any>
) {
  if (!SENTRY_DSN) return;

  Sentry.withScope(scope => {
    scope.setLevel(level);

    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message);
  });
}

/**
 * Establece información del usuario para contexto
 *
 * @example
 * setUser({
 *   id: empleador.id,
 *   email: empleador.email
 * });
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
}) {
  if (!SENTRY_DSN) return;

  Sentry.setUser(user);
}

/**
 * Limpia información del usuario (útil en logout)
 */
export function clearUser() {
  if (!SENTRY_DSN) return;

  Sentry.setUser(null);
}

/**
 * Agrega breadcrumb para contexto adicional
 *
 * @example
 * addBreadcrumb({
 *   category: 'postulacion',
 *   message: 'Usuario comenzó a llenar formulario',
 *   level: 'info'
 * });
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Wrapper para funciones async que captura errores automáticamente
 *
 * @example
 * const uploadWithErrorTracking = withErrorTracking(
 *   uploadCV,
 *   'Upload CV'
 * );
 * await uploadWithErrorTracking(file);
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error, {
        context,
        extra: {
          arguments: args
        }
      });
      throw error; // Re-throw para que el llamador maneje el error
    }
  }) as T;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export { Sentry };
