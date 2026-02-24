import type { APIRoute } from 'astro';
import { getEmpleadorSession } from '../../../lib/auth';
import { createServiceClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getEmpleadorSession(cookies);
  if (!session) {
    return new Response(null, { status: 302, headers: { Location: '/empleador/login' } });
  }

  const form = await request.formData();
  const id = form.get('id') as string;
  if (!id) {
    return new Response(null, { status: 302, headers: { Location: '/empleador/dashboard' } });
  }

  const serviceClient = createServiceClient();

  // Obtener estado actual
  const { data: oferta } = await serviceClient
    .from('ofertas')
    .select('id, activa, empleador_id')
    .eq('id', id)
    .eq('empleador_id', session.empleador.id)
    .single();

  if (!oferta) {
    return new Response(null, { status: 302, headers: { Location: '/empleador/dashboard' } });
  }

  await serviceClient
    .from('ofertas')
    .update({ activa: !oferta.activa })
    .eq('id', id)
    .eq('empleador_id', session.empleador.id);

  return new Response(null, {
    status: 302,
    headers: { Location: '/empleador/dashboard' },
  });
};
