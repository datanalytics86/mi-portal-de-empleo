import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/database';
import { z } from 'zod';

const Schema = z.object({
  access_token: z.string().min(10),
  refresh_token: z.string().min(1),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const parsed = Schema.safeParse({
    access_token: form.get('access_token'),
    refresh_token: form.get('refresh_token'),
    password: form.get('password'),
  });

  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || 'Datos inválidos.';
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { access_token, refresh_token, password } = parsed.data;

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey);

  /* Establecer sesión con el token de recuperación */
  const { error: sessionError } = await client.auth.setSession({
    access_token,
    refresh_token,
  });

  if (sessionError) {
    return new Response(JSON.stringify({ error: 'El enlace expiró o ya fue usado. Solicita uno nuevo.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error } = await client.auth.updateUser({ password });

  if (error) {
    return new Response(JSON.stringify({ error: 'No se pudo actualizar la contraseña. Intenta de nuevo.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
