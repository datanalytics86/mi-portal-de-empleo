import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/supabase';
import { setSessionCookies, isValidEmail } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    // Validaciones
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email y contraseña son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Intentar login con Supabase Auth
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error en login:', error.message);

      // Mensajes de error específicos
      if (error.message.includes('Invalid login credentials')) {
        return new Response(
          JSON.stringify({ error: 'Email o contraseña incorrectos' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Error al iniciar sesión' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.session || !data.user) {
      return new Response(
        JSON.stringify({ error: 'Error al crear sesión' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el usuario existe en la tabla empleadores
    const { data: empleador, error: empleadorError } = await supabaseServer
      .from('empleadores')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (empleadorError || !empleador) {
      console.error('Usuario no encontrado en tabla empleadores:', empleadorError);
      return new Response(
        JSON.stringify({ error: 'Usuario no autorizado' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Establecer cookies de sesión
    setSessionCookies(
      cookies,
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_in || 3600
    );

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error inesperado en login:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
