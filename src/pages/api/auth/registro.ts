/**
 * API Route: Registro de Empleador (MOCK VERSION)
 *
 * Registra nuevos empleadores usando sistema mock
 */

import type { APIRoute } from 'astro';
import { mockRegister, setMockSession, isValidEmail, isValidPassword } from '../../../lib/mock-auth';

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

    // Intentar registrar usuario
    try {
      const newUser = mockRegister(email, password, nombreEmpresa.trim());

      // Establecer sesión automáticamente
      setMockSession(cookies, newUser.id);

      console.log('[Registro Mock] Nuevo usuario:', newUser.email);

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            nombre_empresa: newUser.nombre_empresa
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'El email ya está registrado') {
        return new Response(
          JSON.stringify({ error: 'El email ya está registrado' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('[Registro Mock] Error inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
