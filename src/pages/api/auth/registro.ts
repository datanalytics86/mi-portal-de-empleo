import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/supabase';
import { setSessionCookies, isValidEmail, isValidPassword } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password, nombreEmpresa } = await request.json();

    // Validaciones
    if (!email || !password || !nombreEmpresa) {
      return new Response(
        JSON.stringify({ error: 'Todos los campos son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (nombreEmpresa.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'El nombre de empresa debe tener al menos 2 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseServer.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Error al crear usuario:', authError.message);

      // Mensajes de error específicos
      if (authError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'Este email ya está registrado' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Error al crear la cuenta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user || !authData.session) {
      return new Response(
        JSON.stringify({ error: 'Error al crear la cuenta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear registro en tabla empleadores
    const { error: empleadorError } = await supabaseServer
      .from('empleadores')
      .insert({
        id: authData.user.id,
        email: email,
        nombre_empresa: nombreEmpresa.trim(),
      });

    if (empleadorError) {
      console.error('Error al crear empleador:', empleadorError.message);

      // Intentar eliminar el usuario de Auth si falla la creación del empleador
      try {
        await supabaseServer.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Error al eliminar usuario tras fallo:', deleteError);
      }

      return new Response(
        JSON.stringify({ error: 'Error al crear el perfil de empleador' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Establecer cookies de sesión
    setSessionCookies(
      cookies,
      authData.session.access_token,
      authData.session.refresh_token,
      authData.session.expires_in || 3600
    );

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error inesperado en registro:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
