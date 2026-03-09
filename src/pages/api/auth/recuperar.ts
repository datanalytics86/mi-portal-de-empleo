import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { z } from 'zod';

const Schema = z.object({
  email: z.string().email('Email inválido'),
});

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const parsed = Schema.safeParse({
    email: (form.get('email') as string)?.trim().toLowerCase(),
  });

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Email inválido.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/empleador/nueva-contrasena`;

  // Siempre retornamos ok para evitar enumeración de emails
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
