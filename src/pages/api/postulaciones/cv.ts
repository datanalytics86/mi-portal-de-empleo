import type { APIRoute } from 'astro';
import { createServiceClient } from '../../../lib/supabase';
import { getEmpleadorSession } from '../../../lib/auth';

// Descarga segura de CV: solo el empleador dueño de la oferta puede descargar
export const GET: APIRoute = async ({ url, cookies }) => {
  const session = await getEmpleadorSession(cookies);
  if (!session) {
    return new Response('No autorizado', { status: 401 });
  }

  const postulacionId = url.searchParams.get('id');
  if (!postulacionId) return new Response('ID requerido', { status: 400 });

  const serviceClient = createServiceClient();

  // Verificar que la postulación pertenece a una oferta del empleador
  const { data: postulacion } = await serviceClient
    .from('postulaciones')
    .select('cv_url, ofertas!inner(empleador_id)')
    .eq('id', postulacionId)
    .single();

  if (!postulacion) return new Response('No encontrado', { status: 404 });

  const oferta = postulacion.ofertas as unknown as { empleador_id: string };
  if (oferta.empleador_id !== session.empleador.id) {
    return new Response('No autorizado', { status: 403 });
  }

  // Generar URL firmada de descarga (válida 60 segundos)
  const { data: signedData, error } = await serviceClient.storage
    .from('cvs')
    .createSignedUrl(postulacion.cv_url, 60);

  if (error || !signedData) {
    return new Response('Error al generar la URL de descarga', { status: 500 });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: signedData.signedUrl },
  });
};
