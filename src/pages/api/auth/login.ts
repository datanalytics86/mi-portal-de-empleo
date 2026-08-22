import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '../../../lib/auth';
import {
  checkAuthRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../lib/rate-limit';
import { log, captureException } from '../../../lib/observability';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Email inválido').max(200),
  password: z.string().min(1, 'Contraseña requerida').max(200),
});

const AUTH_RL_MSG =
  'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.';

function json(body: unknown, status: number, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function fieldString(value: unknown): string {
  if (typeof value === 'string') return value;
  return '';
}

async function readLoginFields(
  request: Request,
): Promise<{ email: string; password: string } | null> {
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      return {
        email: fieldString(body.email).trim().toLowerCase(),
        password: fieldString(body.password),
      };
    }
    const form = await request.formData();
    return {
      email: fieldString(form.get('email')).trim().toLowerCase(),
      password: fieldString(form.get('password')),
    };
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = getClientIp(request);

  try {
    const fields = await readLoginFields(request);
    if (!fields) {
      const rl = await checkAuthRateLimits({ ip, preset: 'auth-login' });
      if (!rl.success) return rateLimitResponse(rl, AUTH_RL_MSG);
      return json({ error: 'Datos inválidos.' }, 400);
    }

    const parsed = LoginSchema.safeParse({
      email: fields.email,
      password: fields.password,
    });

    const rl = await checkAuthRateLimits({
      ip,
      email: fields.email || null,
      preset: 'auth-login',
    });
    if (!rl.success) {
      return rateLimitResponse(rl, AUTH_RL_MSG);
    }

    if (!parsed.success) {
      return json(
        { error: parsed.error.errors[0]?.message || 'Email y contraseña requeridos.' },
        400,
      );
    }

    const { email, password } = parsed.data;

    let sessionToken: string | null = null;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        log.info('auth.login_failed', { reason: 'invalid_credentials' });
        return json({ error: 'Email o contraseña incorrectos.' }, 401);
      }
      sessionToken = data.session.access_token;
    } catch (err) {
      log.error('auth.login_exception', {
        error: err instanceof Error ? err.message : String(err),
      });
      void captureException(err, { tags: { component: 'auth', action: 'login' } });
      return json({ error: 'Error al iniciar sesión. Intenta de nuevo.' }, 500);
    }

    cookies.set(SESSION_COOKIE, sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
    });

    return json({ ok: true }, 200);
  } catch (err) {
    log.error('auth.login_unhandled', {
      error: err instanceof Error ? err.message : String(err),
    });
    void captureException(err, { tags: { component: 'auth', action: 'login' } });
    return json({ error: 'Error al iniciar sesión. Intenta de nuevo.' }, 500);
  }
};
