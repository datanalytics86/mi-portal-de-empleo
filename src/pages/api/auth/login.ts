/**
 * API Route: Login de Empleador (MOCK VERSION)
 *
 * Autentica empleadores usando sistema mock
 */

import type { APIRoute } from 'astro';
import { mockLogin, setMockSession, isValidEmail } from '../../../lib/mock-auth';

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

    // Intentar login con sistema mock
    const user = mockLogin(email, password);

    if (!user) {
      console.warn('[Login Mock] Intento fallido:', email);
      return new Response(
        JSON.stringify({ error: 'Email o contraseña incorrectos' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Establecer sesión
    setMockSession(cookies, user.id);

    console.log('[Login Mock] Sesión iniciada:', user.email);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          nombre_empresa: user.nombre_empresa
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Login Mock] Error inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
