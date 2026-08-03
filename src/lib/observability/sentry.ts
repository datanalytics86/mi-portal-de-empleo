/**
 * Sentry opcional (fail-soft).
 *
 * - Si no hay SENTRY_DSN → no-op (la app sigue igual).
 * - Import dinámico de @sentry/node para no cargar el SDK en cold starts sin DSN.
 * - Nunca lanza hacia el caller.
 */

import { log } from './logger';

type SentryModule = typeof import('@sentry/node');

let initPromise: Promise<SentryModule | null> | null = null;
let sentry: SentryModule | null = null;

function getDsn(): string | undefined {
  const dsn =
    (typeof import.meta !== 'undefined' && import.meta.env?.SENTRY_DSN) ||
    (typeof process !== 'undefined' ? process.env.SENTRY_DSN : undefined);
  return dsn?.trim() || undefined;
}

/**
 * Inicializa Sentry una sola vez si hay DSN.
 * Seguro llamar en cada request (memoizado).
 */
export async function ensureSentry(): Promise<SentryModule | null> {
  if (sentry) return sentry;
  if (initPromise) return initPromise;

  const dsn = getDsn();
  if (!dsn) return null;

  initPromise = (async () => {
    try {
      const mod = await import('@sentry/node');
      mod.init({
        dsn,
        environment:
          import.meta.env.MODE ||
          (typeof process !== 'undefined' ? process.env.NODE_ENV : undefined) ||
          'production',
        tracesSampleRate: Number(import.meta.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.05) || 0.05,
        // No enviar PII por defecto
        sendDefaultPii: false,
      });
      sentry = mod;
      log.info('sentry.initialized', { environment: import.meta.env.MODE });
      return mod;
    } catch (err) {
      log.warn('sentry.init_failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  })();

  return initPromise;
}

export function isSentryConfigured(): boolean {
  return Boolean(getDsn());
}

/** Reporta excepción a Sentry (no-op sin DSN). Nunca lanza. */
export async function captureException(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: 'fatal' | 'error' | 'warning' | 'info';
  },
): Promise<void> {
  try {
    const S = await ensureSentry();
    if (!S) return;

    S.withScope((scope) => {
      if (context?.tags) {
        for (const [k, v] of Object.entries(context.tags)) scope.setTag(k, v);
      }
      if (context?.extra) {
        for (const [k, v] of Object.entries(context.extra)) scope.setExtra(k, v);
      }
      if (context?.level) scope.setLevel(context.level);
      S.captureException(error);
    });
  } catch (err) {
    log.warn('sentry.capture_failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Mensaje / evento de negocio (p.ej. parse failed esperado). */
export async function captureMessage(
  message: string,
  context?: {
    level?: 'fatal' | 'error' | 'warning' | 'info';
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const S = await ensureSentry();
    if (!S) return;

    S.withScope((scope) => {
      if (context?.tags) {
        for (const [k, v] of Object.entries(context.tags)) scope.setTag(k, v);
      }
      if (context?.extra) {
        for (const [k, v] of Object.entries(context.extra)) scope.setExtra(k, v);
      }
      S.captureMessage(message, context?.level ?? 'info');
    });
  } catch {
    /* soft */
  }
}
