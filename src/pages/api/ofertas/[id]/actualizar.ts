/**
 * API Route: Actualizar Oferta de Empleo
 *
 * Actualiza ofertas usando Supabase o sistema mock (fallback)
 * Si Supabase está configurado: Actualiza en tabla ofertas con RLS
 * Si NO está configurado: Usa modo mock (solo para desarrollo)
 */

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';
import { getUserId } from '../../../../lib/auth';
import { getMockSession } from '../../../../lib/mock-auth';
import { findComuna } from '../../../../lib/comunas';
import { mockOfertas, findOfertaById } from '../../../../data/mock-ofertas';
import { empleadorOwnsOferta } from '../../../../data/mock-empleador-ofertas';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID de oferta no proporcionado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[API /ofertas/${id}/actualizar ${isSupabaseConfigured() ? 'SUPABASE' : 'MOCK'}] Actualizando oferta`);

    // ─────────────────────────────────────────────────────────────────────
    // 1. VERIFICAR AUTENTICACIÓN
    // ─────────────────────────────────────────────────────────────────────

    let empleadorId: string | null = null;
    let empleador: any = null;

    if (isSupabaseConfigured()) {
      empleadorId = await getUserId(cookies);
      if (!empleadorId) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      empleador = getMockSession(cookies);
      if (!empleador) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      empleadorId = empleador.id;

      // Verificar que la oferta existe (solo en modo mock)
      const oferta = findOfertaById(id);
      if (!oferta) {
        return new Response(
          JSON.stringify({ error: 'Oferta no encontrada' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verificar que la oferta pertenece al empleador (solo en modo mock)
      if (!empleadorOwnsOferta(empleador.id, id)) {
        return new Response(
          JSON.stringify({ error: 'No tienes permiso para editar esta oferta' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. OBTENER Y VALIDAR DATOS
    // ─────────────────────────────────────────────────────────────────────

    const body = await request.json();
    const { titulo, descripcion, empresa, tipo_jornada, categoria, comuna, expires_at } = body;

    // Validaciones
    if (!titulo || !descripcion || !empresa || !tipo_jornada || !comuna || !expires_at) {
      return new Response(
        JSON.stringify({ error: 'Todos los campos requeridos deben estar completos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (titulo.length < 3 || titulo.length > 100) {
      return new Response(
        JSON.stringify({ error: 'El título debe tener entre 3 y 100 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (descripcion.length < 50 || descripcion.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'La descripción debe tener entre 50 y 2000 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tiposJornadaValidos = ['Full-time', 'Part-time', 'Freelance', 'Práctica'];
    if (!tiposJornadaValidos.includes(tipo_jornada)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de jornada inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar fecha de expiración
    const expirationDate = new Date(expires_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 90);

    if (expirationDate < today) {
      return new Response(
        JSON.stringify({ error: 'La fecha de expiración no puede ser en el pasado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (expirationDate > maxDate) {
      return new Response(
        JSON.stringify({ error: 'La fecha de expiración no puede ser mayor a 90 días' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener coordenadas de la comuna
    const comunaData = findComuna(comuna);
    if (!comunaData) {
      return new Response(
        JSON.stringify({ error: 'Comuna no encontrada' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. ACTUALIZAR OFERTA EN SUPABASE O MOCK
    // ─────────────────────────────────────────────────────────────────────

    if (isSupabaseConfigured() && supabase && empleadorId) {
      // Modo Supabase: Actualizar en BD (RLS garantiza que solo el dueño puede editar)

      const ubicacion = {
        region: comunaData.region,
        comuna: comunaData.nombre,
        lat: comunaData.lat,
        lng: comunaData.lng
      };

      const { data, error } = await (supabase as any)
        .from('ofertas')
        .update({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          empresa: empresa.trim(),
          ubicacion,
          tipo: tipo_jornada,
          categoria: categoria || 'General'
        })
        .eq('id', id)
        .eq('empleador_id', empleadorId) // Verificación adicional de seguridad
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error actualizando oferta:', error);

        // Si no se encontró o no tiene permiso
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Oferta no encontrada o no tienes permiso para editarla' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Error al actualizar la oferta' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('[Supabase] Oferta actualizada:', data.id);

      return new Response(
        JSON.stringify({
          success: true,
          oferta: data,
          message: 'Oferta actualizada exitosamente'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } else {
      // Modo Mock: Actualizar en memoria

      const ofertaIndex = mockOfertas.findIndex(o => o.id === id);
      if (ofertaIndex !== -1) {
        mockOfertas[ofertaIndex] = {
          ...mockOfertas[ofertaIndex],
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          empresa: empresa.trim(),
          tipo_jornada,
          categoria: categoria || null,
          comuna: comunaData.nombre,
          region: comunaData.region,
          expires_at: expires_at + 'T23:59:59Z',
        };
      }

      console.log(`[MOCK] Oferta actualizada: ${id} - ${titulo}`);

      return new Response(
        JSON.stringify({
          success: true,
          oferta: mockOfertas[ofertaIndex],
          message: 'Oferta actualizada exitosamente'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[API /ofertas/actualizar] Error inesperado:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
