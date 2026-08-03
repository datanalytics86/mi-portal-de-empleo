/**
 * Rate limiting distribuido (Upstash Redis) con fallback in-memory.
 *
 * - Si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN están configurados → Redis.
 * - Si no, o si Upstash falla → Map en memoria + log (degradación elegante).
 * - Multi-instancia: solo Upstash es correcto; el fallback es por proceso (Vercel).
 * - Auth: combinar IP + email con checkAuthRateLimits (el más restrictivo gana).
 *
 * Uso:
 *   const result = await checkRateLimit(ip, 'auth-login');
 *   const auth = await checkAuthRateLimits({ ip, email, preset: 'auth-login' });
 *   if (!result.success) return rateLimitResponse(result);
 */

export type RateLimitBackend = 'upstash' | 'memory';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms cuando se reinicia la ventana */
  reset: number;
  backend: RateLimitBackend;
  /** Dimensión que provocó el bloqueo (si aplica) */
  blockedBy?: 'ip' | 'email' | 'identifier';
}

export type RateLimitPreset =
  | 'auth-login'
  | 'auth-registro'
  | 'postulaciones';

/** Presets de auth que soportan IP + email compuesto */
export type AuthRateLimitPreset = 'auth-login' | 'auth-registro';

interface PresetConfig {
  /** Máximo de requests por ventana */
  limit: number;
  /** Ventana en segundos */
  windowSec: number;
  /** Prefijo de clave Redis / memoria */
  prefix: string;
}

const PRESETS: Record<RateLimitPreset, PresetConfig> = {
  'auth-login': {
    limit: 10,
    windowSec: 15 * 60, // 10 intentos / 15 min
    prefix: 'rl:auth-login',
  },
  'auth-registro': {
    limit: 5,
    windowSec: 60 * 60, // 5 registros / hora
    prefix: 'rl:auth-registro',
  },
  postulaciones: {
    limit: 3,
    windowSec: 60 * 60, // 3 postulaciones / hora (histórico del producto)
    prefix: 'rl:postulaciones',
  },
};

// ─── In-memory fallback ─────────────────────────────────────────────────────

type MemoryBucket = { timestamps: number[] };
const memoryStore = new Map<string, MemoryBucket>();

function checkMemory(identifier: string, cfg: PresetConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = cfg.windowSec * 1000;
  const key = `${cfg.prefix}:${identifier}`;
  const bucket = memoryStore.get(key) || { timestamps: [] };
  const active = bucket.timestamps.filter((t) => now - t < windowMs);

  if (active.length >= cfg.limit) {
    const oldest = active[0] ?? now;
    memoryStore.set(key, { timestamps: active });
    return {
      success: false,
      limit: cfg.limit,
      remaining: 0,
      reset: oldest + windowMs,
      backend: 'memory',
    };
  }

  active.push(now);
  memoryStore.set(key, { timestamps: active });

  // GC ligero
  if (memoryStore.size > 500) {
    for (const [k, b] of memoryStore) {
      const kept = b.timestamps.filter((t) => now - t < windowMs);
      if (kept.length === 0) memoryStore.delete(k);
      else memoryStore.set(k, { timestamps: kept });
    }
  }

  return {
    success: true,
    limit: cfg.limit,
    remaining: Math.max(0, cfg.limit - active.length),
    reset: now + windowMs,
    backend: 'memory',
  };
}

// ─── Upstash (lazy singleton) ───────────────────────────────────────────────

type UpstashLimiter = {
  limit: (id: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }>;
};

const upstashLimiters = new Map<RateLimitPreset, UpstashLimiter | null>();
let upstashUnavailableLogged = false;

function hasUpstashEnv(): boolean {
  const url = import.meta.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && token);
}

async function getUpstashLimiter(preset: RateLimitPreset): Promise<UpstashLimiter | null> {
  if (!hasUpstashEnv()) return null;

  if (upstashLimiters.has(preset)) {
    return upstashLimiters.get(preset) ?? null;
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const cfg = PRESETS[preset];
    const redis = new Redis({
      url: import.meta.env.UPSTASH_REDIS_REST_URL!,
      token: import.meta.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Sliding window: más justo que fixed window para auth
    // Duration type de Upstash: `${number} s` | `${number} m` | ...
    const duration = `${cfg.windowSec} s` as `${number} s`;
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cfg.limit, duration),
      prefix: cfg.prefix,
      analytics: false,
    });

    upstashLimiters.set(preset, limiter);
    return limiter;
  } catch (err) {
    if (!upstashUnavailableLogged) {
      console.warn(
        '[rate-limit] Upstash no disponible, usando fallback in-memory:',
        err instanceof Error ? err.message : err,
      );
      upstashUnavailableLogged = true;
    }
    upstashLimiters.set(preset, null);
    return null;
  }
}

// ─── API pública ────────────────────────────────────────────────────────────

/**
 * Normaliza email para claves de rate limit (trim + lowercase).
 * Devuelve null si vacío o no parece email (evita claves basura).
 */
export function normalizeEmailForRateLimit(email: string | null | undefined): string | null {
  if (email == null) return null;
  const e = String(email).trim().toLowerCase();
  if (!e || e.length > 200) return null;
  // Heurística mínima: debe contener @ y un dominio con punto
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

/**
 * Comprueba (y consume) un slot de rate limit para `identifier`.
 * Preferir prefijos `ip:` / `email:` para evitar colisiones entre dimensiones.
 */
export async function checkRateLimit(
  identifier: string,
  preset: RateLimitPreset,
): Promise<RateLimitResult> {
  const cfg = PRESETS[preset];
  const id = identifier || 'unknown';

  const limiter = await getUpstashLimiter(preset);
  if (limiter) {
    try {
      const res = await limiter.limit(id);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
        backend: 'upstash',
        blockedBy: res.success ? undefined : 'identifier',
      };
    } catch (err) {
      console.error(
        '[rate-limit] Error Upstash, degradando a memoria:',
        err instanceof Error ? err.message : err,
      );
      return { ...checkMemory(id, cfg), blockedBy: undefined };
    }
  }

  if (hasUpstashEnv() && !upstashUnavailableLogged) {
    // Env presente pero limiter null (import falló)
    console.info('[rate-limit] Usando backend in-memory (Upstash no inicializado)');
  } else if (!hasUpstashEnv()) {
    // Silencioso en dev; un log ocasional ayuda en prod multi-instancia
  }

  return checkMemory(id, cfg);
}

/**
 * Rate limit compuesto para auth: IP + email (si hay email válido).
 * Ambos contadores se consumen; el más restrictivo gana (cualquiera bloqueado → 429).
 * No revelar en la respuesta si el bloqueo fue por IP o por email.
 */
export async function checkAuthRateLimits(opts: {
  ip: string;
  email?: string | null;
  preset: AuthRateLimitPreset;
}): Promise<RateLimitResult> {
  const ipKey = `ip:${opts.ip || 'unknown'}`;
  const emailNorm = normalizeEmailForRateLimit(opts.email ?? null);

  const checks: Array<Promise<RateLimitResult & { dim: 'ip' | 'email' }>> = [
    checkRateLimit(ipKey, opts.preset).then((r) => ({ ...r, dim: 'ip' as const })),
  ];

  if (emailNorm) {
    checks.push(
      checkRateLimit(`email:${emailNorm}`, opts.preset).then((r) => ({
        ...r,
        dim: 'email' as const,
      })),
    );
  }

  const results = await Promise.all(checks);
  const blocked = results.find((r) => !r.success);

  if (blocked) {
    // No loguear el email en claro; solo dimensión y backend
    console.info(
      `[rate-limit] auth blocked preset=${opts.preset} by=${blocked.dim} backend=${blocked.backend}`,
    );
    return {
      success: false,
      limit: blocked.limit,
      remaining: 0,
      reset: blocked.reset,
      backend: blocked.backend,
      // Interno para logs/tests; la API no expone al cliente si fue IP o email
      blockedBy: blocked.dim,
    };
  }

  return {
    success: true,
    limit: results[0]!.limit,
    remaining: Math.min(...results.map((r) => r.remaining)),
    reset: Math.max(...results.map((r) => r.reset)),
    backend: results.some((r) => r.backend === 'upstash') ? 'upstash' : 'memory',
  };
}

/** Extrae IP del request (Vercel / Cloudflare / genérico). */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('cf-connecting-ip')?.trim() ||
    'unknown'
  );
}

/** Headers estándar de rate limit (RFC-ish). */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
    ...(result.success ? {} : { 'Retry-After': String(retryAfterSec) }),
  };
}

/** Respuesta 429 JSON lista para API routes. */
export function rateLimitResponse(
  result: RateLimitResult,
  message = 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      ...rateLimitHeaders(result),
    },
  });
}

/** Solo para tests / diagnóstico. */
export function __resetMemoryStoreForTests(): void {
  memoryStore.clear();
  upstashLimiters.clear();
  upstashUnavailableLogged = false;
}

export function getPresetConfig(preset: RateLimitPreset): PresetConfig {
  return { ...PRESETS[preset] };
}
