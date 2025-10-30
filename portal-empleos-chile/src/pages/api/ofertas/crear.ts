import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/supabase';
import { getSession, getEmpleadorProfile } from '../../../lib/auth';
import { findComuna } from '../../../lib/comunas';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
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

    // Crear punto geográfico en formato WKT para PostGIS
    const ubicacionWKT = `POINT(${comunaData.lng} ${comunaData.lat})`;

    // Insertar oferta en la base de datos
    const { data, error } = await supabaseServer
      .from('ofertas')
      .insert({
        empleador_id: empleador.id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        empresa: empresa.trim(),
        tipo_jornada,
        categoria: categoria || null,
        comuna: comuna,
        ubicacion: ubicacionWKT,
        activa: true,
        expires_at: expires_at,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear oferta:', error);
      return new Response(
        JSON.stringify({ error: 'Error al crear la oferta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        oferta: data,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error inesperado al crear oferta:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
