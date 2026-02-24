import type { APIRoute } from 'astro';
import { supabase, createServiceClient } from '../../../lib/supabase';
import { SESSION_COOKIE } from '../../../lib/auth';
import { z } from 'zod';

const RegistroSchema = z.object({
  empresa: z.string().min(2, 'Nombre de empresa demasiado corto').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  const form = await request.formData();
  const parsed = RegistroSchema.safeParse({
    empresa: form.get('empresa'),
    email: (form.get('email') as string)?.trim().toLowerCase(),
    password: form.get('password'),
  });

  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || 'Datos inválidos.';
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
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
      status: 400, headers: { 'Content-Type': 'application/json' },
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
    return new Response(JSON.stringify({ error: 'Error al guardar los datos. Intenta de nuevo.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Auto-login: si el usuario ya tiene sesión (no requiere confirmación de email)
  if (authData.session?.access_token) {
    cookies.set(SESSION_COOKIE, authData.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
