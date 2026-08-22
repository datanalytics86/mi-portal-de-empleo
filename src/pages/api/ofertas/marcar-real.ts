import type { APIRoute } from 'astro';
import { createServiceClient } from '../../../lib/supabase';
import { getSql } from '../../../lib/neon';

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.session!;
  const form = await request.formData();
  const id = String(form.get('id') || '');
  const back = '/empleador/dashboard';
  if (!id) {
    return new Response(null, { status: 302, headers: { Location: back } });
  }

  try {
    const serviceClient = createServiceClient();
    await serviceClient
      .from('ofertas')
      .update({ is_demo: false })
      .eq('id', id)
      .eq('empleador_id', session.empleador.id);
  } catch {
    /* supabase opcional */
  }

  try {
    const sql = getSql();
    if (sql) {
      await sql`
        UPDATE public.ofertas
        SET is_demo = FALSE
        WHERE id = ${id}::uuid AND empleador_id = ${session.empleador.id}::uuid
      `;
    }
  } catch {
    /* neon opcional */
  }

  return new Response(null, { status: 302, headers: { Location: back } });
};
