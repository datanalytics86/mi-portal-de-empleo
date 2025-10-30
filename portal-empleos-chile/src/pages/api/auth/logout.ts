import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/supabase';
import { clearSessionCookies, getSession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Obtener sesión actual
    const { session } = await getSession(cookies);

    // Cerrar sesión en Supabase si existe una sesión
    if (session) {
      const { error } = await supabaseServer.auth.signOut();

      if (error) {
        console.error('Error al cerrar sesión en Supabase:', error.message);
        // Continuar eliminando cookies aunque falle en Supabase
      }
    }

    // Eliminar cookies de sesión
    clearSessionCookies(cookies);

    return new Response(
      JSON.stringify({ success: true, message: 'Sesión cerrada correctamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error inesperado en logout:', error);

    // Asegurarse de eliminar cookies incluso si hay error
    clearSessionCookies(cookies);

    return new Response(
      JSON.stringify({ error: 'Error al cerrar sesión' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
