/**
 * Logger estructurado (JSON) para Vercel / GitHub Actions / local.
 * Un evento por línea → fácil de filtrar en Log Drains / Sentry breadcrumbs.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFields = Record<string, unknown>;

function emit(level: LogLevel, event: string, fields: LogFields = {}): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitize(fields),
  };
  const line = JSON.stringify(payload);
  switch (level) {
    case 'error':
      console.error(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'debug':
      if (import.meta.env.DEV) console.debug(line);
      break;
    default:
      console.info(line);
  }
}

/** Evita volcar buffers/binarios o PII obvia en logs. */
function sanitize(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v instanceof ArrayBuffer || (typeof Buffer !== 'undefined' && Buffer.isBuffer(v))) {
      out[k] = `[binary ${v.byteLength ?? (v as Buffer).length}b]`;
      continue;
    }
    if (typeof v === 'string' && v.length > 500) {
      out[k] = `${v.slice(0, 500)}…`;
      continue;
    }
    // No loguear emails completos en claro si la clave lo sugiere
    if (/email/i.test(k) && typeof v === 'string' && v.includes('@')) {
      const [user, domain] = v.split('@');
      out[k] = `${user?.slice(0, 2) ?? ''}***@${domain}`;
      continue;
    }
    out[k] = v;
  }
  return out;
}

export const log = {
  debug: (event: string, fields?: LogFields) => emit('debug', event, fields),
  info: (event: string, fields?: LogFields) => emit('info', event, fields),
  warn: (event: string, fields?: LogFields) => emit('warn', event, fields),
  error: (event: string, fields?: LogFields) => emit('error', event, fields),
};
