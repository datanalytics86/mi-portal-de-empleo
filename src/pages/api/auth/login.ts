import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '../../../lib/auth';
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '../../../lib/rate-limit';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Email inválido').max(200),
  password: z.string().min(1, 'Contraseña requerida').max(200),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(ip, 'auth-login');
  if (!rl.success) {
    return rateLimitResponse(
      rl,
      'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.',
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Datos inválidos.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = LoginSchema.safeParse({
    email: (form.get('email') as string)?.trim().toLowerCase(),
    password: form.get('password'),
  });

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.errors[0]?.message || 'Email y contraseña requeridos.' }),
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
