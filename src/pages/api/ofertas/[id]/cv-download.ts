import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getSession, getEmpleadorProfile } from '../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Verificar autenticación
    const { user } = await getSession(cookies);
    const empleador = await getEmpleadorProfile(cookies);

    if (!user || !empleador) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { cv_url } = body;

    if (!cv_url) {
      return new Response(
        JSON.stringify({ error: 'URL del CV es requerida' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato UUID de la oferta
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return new Response(
        JSON.stringify({ error: 'ID de oferta inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que la oferta pertenece al empleador autenticado
    const { data: oferta, error: ofertaError } = await supabaseAdmin
      .from('ofertas')
      .select('id')
      .eq('id', id)
      .eq('empleador_id', (empleador as any).id)
      .single();

    if (ofertaError || !oferta) {
      return new Response(
        JSON.stringify({ error: 'Oferta no encontrada o no tienes permiso' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el CV pertenece a una postulación de esta oferta
    const { data: postulacion, error: postulacionError } = await supabaseAdmin
      .from('postulaciones')
      .select('id')
      .eq('oferta_id', id)
      .eq('cv_url', cv_url)
      .single();

    if (postulacionError || !postulacion) {
      return new Response(
        JSON.stringify({ error: 'CV no encontrado para esta oferta' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generar URL firmada de Supabase Storage (válida por 1 hora)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from('cvs')
      .createSignedUrl(cv_url, 3600); // 3600 segundos = 1 hora

    if (signedUrlError || !signedUrlData) {
      console.error('Error al generar URL firmada:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Error al generar enlace de descarga' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: signedUrlData.signedUrl,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error inesperado al obtener URL de descarga:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
