/**
 * API Route: Crear Oferta de Empleo
 *
 * Crea nuevas ofertas usando Supabase o sistema mock (fallback)
 * Si Supabase está configurado: Inserta en tabla ofertas
 * Si NO está configurado: Usa modo mock (solo para desarrollo)
 */

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { getUserId } from '../../../lib/auth';
import { getMockSession } from '../../../lib/mock-auth';
import { findComuna } from '../../../lib/comunas';
import { mockOfertas } from '../../../data/mock-ofertas';
import { empleadorOfertasMap } from '../../../data/mock-empleador-ofertas';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log(`[API /ofertas/crear ${isSupabaseConfigured() ? 'SUPABASE' : 'MOCK'}] Creando oferta`);

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
    // 3. CREAR OFERTA EN SUPABASE O MOCK
    // ─────────────────────────────────────────────────────────────────────

    if (isSupabaseConfigured() && supabase && empleadorId) {
      // Modo Supabase: Insertar en BD

      const ubicacion = {
        region: comunaData.region,
        comuna: comunaData.nombre,
        lat: comunaData.lat,
        lng: comunaData.lng
      };

      const { data, error } = await (supabase as any)
        .from('ofertas')
        .insert({
          empleador_id: empleadorId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          empresa: empresa.trim(),
          ubicacion,
          tipo: tipo_jornada,
          categoria: categoria || 'General',
          salario: null, // Puede ser extendido en el futuro
          requisitos: [],
          beneficios: [],
          activa: true
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error creando oferta:', error);
        return new Response(
          JSON.stringify({ error: 'Error al crear la oferta' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('[Supabase] Oferta creada:', (data as any).id);

      return new Response(
        JSON.stringify({
          success: true,
          oferta: data,
          message: 'Oferta creada exitosamente'
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );

    } else {
      // Modo Mock: Crear en memoria

      // Generar nuevo ID (usar el número siguiente al último)
      const maxId = Math.max(...mockOfertas.map(o => parseInt(o.id)), 0);
      const newId = (maxId + 1).toString();

      // Crear nueva oferta
      const nuevaOferta: typeof mockOfertas[0] = {
        id: newId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        empresa: empresa.trim(),
        tipo_jornada,
        categoria: categoria || null,
        comuna: comunaData.nombre,
        region: comunaData.region,
        activa: true,
        expires_at: expires_at + 'T23:59:59Z',
        created_at: new Date().toISOString(),
        postulaciones_count: 0
      };

      // Agregar a mock ofertas (en memoria)
      mockOfertas.push(nuevaOferta);

      // Actualizar empleadorOfertasMap
      if (!empleadorOfertasMap[empleador!.id]) {
        empleadorOfertasMap[empleador!.id] = [];
      }
      empleadorOfertasMap[empleador!.id].push(newId);

      console.log(`[MOCK] Nueva oferta creada: ${newId} - ${titulo}`);

      return new Response(
        JSON.stringify({
          success: true,
          oferta: nuevaOferta,
          message: 'Oferta creada exitosamente'
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[API /ofertas/crear] Error inesperado:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
