/**
 * API Route: Logout de Empleador (MOCK VERSION)
 *
 * Cierra sesión del empleador
 */

import type { APIRoute } from 'astro';
import { clearMockSession } from '../../../lib/mock-auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Eliminar cookie de sesión
    clearMockSession(cookies);

    console.log('[Logout Mock] Sesión cerrada');

    return new Response(
      JSON.stringify({ success: true, message: 'Sesión cerrada correctamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Logout Mock] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error al cerrar sesión' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
