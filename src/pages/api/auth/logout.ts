/**
 * API Route: Logout de Empleador
 *
 * Cierra sesión del empleador usando Supabase Auth o sistema mock (fallback)
 * Si Supabase está configurado: Usa supabase.auth.signOut()
 * Si NO está configurado: Usa modo mock (solo para desarrollo)
 */

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { clearSessionCookies } from '../../../lib/auth';
import { clearMockSession } from '../../../lib/mock-auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    console.log(`[API /auth/logout ${isSupabaseConfigured() ? 'SUPABASE' : 'MOCK'}] Cerrando sesión`);

    if (isSupabaseConfigured() && supabase) {
      // Modo Supabase: Cerrar sesión real
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[Supabase Logout] Error:', error.message);
        // Aún así limpiar cookies locales
      }

      // Limpiar cookies de sesión
      clearSessionCookies(cookies);

      console.log('[Supabase Logout] Sesión cerrada');

    } else {
      // Modo Mock: Limpiar sesión mock
      clearMockSession(cookies);

      console.log('[Logout Mock] Sesión cerrada');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Sesión cerrada correctamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[API /auth/logout] Error inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Error al cerrar sesión' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
