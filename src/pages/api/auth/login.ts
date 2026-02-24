import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { SESSION_COOKIE } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const form = await request.formData();
  const email = (form.get('email') as string)?.trim().toLowerCase();
  const password = form.get('password') as string;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email y contraseña requeridos.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return new Response(JSON.stringify({ error: 'Email o contraseña incorrectos.' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  cookies.set(SESSION_COOKIE, data.session.access_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
