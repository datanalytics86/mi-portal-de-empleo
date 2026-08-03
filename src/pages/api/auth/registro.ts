import type { APIRoute } from 'astro';
import { supabase, createServiceClient } from '../../../lib/supabase';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '../../../lib/auth';
import {
  checkAuthRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../lib/rate-limit';
import { log, captureException } from '../../../lib/observability';
import { z } from 'zod';

const RegistroSchema = z.object({
  empresa: z.string().min(2, 'Nombre de empresa demasiado corto').max(100),
  email: z.string().email('Email inválido').max(200),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(200),
});

const AUTH_RL_MSG =
  'Demasiados intentos de registro. Espera una hora e inténtalo de nuevo.';

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = getClientIp(request);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    const rl = await checkAuthRateLimits({ ip, preset: 'auth-registro' });
    if (!rl.success) return rateLimitResponse(rl, AUTH_RL_MSG);
    return new Response(JSON.stringify({ error: 'Datos inválidos.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawEmail = (form.get('email') as string)?.trim().toLowerCase() ?? '';
  const parsed = RegistroSchema.safeParse({
    empresa: form.get('empresa'),
    email: rawEmail,
    password: form.get('password'),
  });

  // Rate limit IP + email (el más restrictivo gana). Mensaje genérico.
  const rl = await checkAuthRateLimits({
    ip,
    email: rawEmail || null,
    preset: 'auth-registro',
  });
  if (!rl.success) {
    return rateLimitResponse(rl, AUTH_RL_MSG);
  }

  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || 'Datos inválidos.';
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { empresa, email, password } = parsed.data;

  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

  if (authError || !authData.user) {
    const msg = authError?.message?.includes('already registered')
      ? 'Este email ya está registrado.'
      : 'Error al crear la cuenta.';
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Insertar registro en la tabla empleadores (service role para evitar RLS)
  const serviceClient = createServiceClient();
  const { error: dbError } = await serviceClient.from('empleadores').insert({
    id: authData.user.id,
    email,
    empresa,
  });

  if (dbError) {
    // Rollback: eliminar el usuario creado
    await serviceClient.auth.admin.deleteUser(authData.user.id);
    log.error('auth.registro_db_failed', { error: dbError.message });
    void captureException(dbError, { tags: { component: 'auth', action: 'registro' } });
    return new Response(JSON.stringify({ error: 'Error al guardar los datos. Intenta de nuevo.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Auto-login: si el usuario ya tiene sesión (no requiere confirmación de email)
  if (authData.session?.access_token) {
    cookies.set(SESSION_COOKIE, authData.session.access_token, {
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
  }

  // Supabase requiere confirmación de email — informar al frontend
  return new Response(JSON.stringify({ ok: true, requiresEmailConfirmation: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
