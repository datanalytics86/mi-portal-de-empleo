import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getSession, getEmpleadorProfile } from '../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ params, cookies }) => {
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

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return new Response(
        JSON.stringify({ error: 'ID de oferta inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener la oferta actual
    const { data: oferta, error: fetchError } = await supabaseAdmin
      .from('ofertas')
      .select('id, activa')
      .eq('id', id)
      .eq('empleador_id', (empleador as any).id)
      .single();

    if (fetchError || !oferta) {
      return new Response(
        JSON.stringify({ error: 'Oferta no encontrada o no tienes permiso' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Toggle el estado activa
    const nuevoEstado = !(oferta as any).activa;

    const result = await (supabaseAdmin as any)
      .from('ofertas')
      .update({ activa: nuevoEstado })
      .eq('id', id)
      .eq('empleador_id', (empleador as any).id);

    const updateError = result.error;

    if (updateError) {
      console.error('Error al actualizar oferta:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error al cambiar estado de la oferta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        activa: nuevoEstado,
        message: nuevoEstado ? 'Oferta activada' : 'Oferta desactivada',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error inesperado al cambiar estado:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
