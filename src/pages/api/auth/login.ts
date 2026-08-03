import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '../../../lib/auth';
import {
  checkAuthRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../lib/rate-limit';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Email inválido').max(200),
  password: z.string().min(1, 'Contraseña requerida').max(200),
});

const AUTH_RL_MSG =
  'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.';

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = getClientIp(request);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    // Aun sin body: limitar por IP (anti-abuso genérico)
    const rl = await checkAuthRateLimits({ ip, preset: 'auth-login' });
    if (!rl.success) return rateLimitResponse(rl, AUTH_RL_MSG);
    return new Response(JSON.stringify({ error: 'Datos inválidos.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawEmail = (form.get('email') as string)?.trim().toLowerCase() ?? '';
  const parsed = LoginSchema.safeParse({
    email: rawEmail,
    password: form.get('password'),
  });

  // Rate limit IP + email (si hay email parseable). El más restrictivo gana.
  // Se aplica antes del auth real para no gastar consultas en brute-force.
  const rl = await checkAuthRateLimits({
    ip,
    email: rawEmail || null,
    preset: 'auth-login',
  });
  if (!rl.success) {
    return rateLimitResponse(rl, AUTH_RL_MSG);
  }

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: parsed.error.errors[0]?.message || 'Email y contraseña requeridos.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { email, password } = parsed.data;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    // Mensaje genérico: no revelar si el email existe
    return new Response(JSON.stringify({ error: 'Email o contraseña incorrectos.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  cookies.set(SESSION_COOKIE, data.session.access_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
