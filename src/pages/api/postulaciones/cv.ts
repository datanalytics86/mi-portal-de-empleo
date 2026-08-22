import type { APIRoute } from 'astro';
import { createServiceClient } from '../../../lib/supabase';
import { getSql } from '../../../lib/neon';

// Descarga segura de CV: solo el empleador dueño de la oferta puede descargar
export const GET: APIRoute = async ({ url, locals }) => {
  const session = locals.session!;

  const postulacionId = url.searchParams.get('id');
  if (!postulacionId) return new Response('ID requerido', { status: 400 });

  const sql = getSql();
  if (sql) {
    const rows = await sql<{ cv_url: string; empleador_id: string }[]>`
      SELECT p.cv_url, o.empleador_id
      FROM public.postulaciones p
      JOIN public.ofertas o ON o.id = p.oferta_id
      WHERE p.id = ${postulacionId}::uuid
      LIMIT 1
    `;
    const row = rows[0];
    if (row) {
      if (row.empleador_id !== session.empleador.id) {
        return new Response('No autorizado', { status: 403 });
      }
      if (row.cv_url.startsWith('http')) {
        const token = import.meta.env.BLOB_READ_WRITE_TOKEN;
        const res = await fetch(row.cv_url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return new Response('Error al generar la URL de descarga', { status: 500 });
        return new Response(res.body, {
          status: 200,
          headers: {
            'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
            'Content-Disposition': 'attachment',
          },
        });
      }
    }
  }

  const serviceClient = createServiceClient();

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
