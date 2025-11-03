/**
 * API Route: Login de Empleador
 *
 * Autentica empleadores usando Supabase Auth o sistema mock (fallback)
 * Si Supabase está configurado: Usa supabase.auth.signInWithPassword()
 * Si NO está configurado: Usa modo mock (solo para desarrollo)
 */

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { setSessionCookies, isValidEmail } from '../../../lib/auth';
import { mockLogin, setMockSession } from '../../../lib/mock-auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    console.log(`[API /auth/login ${isSupabaseConfigured() ? 'SUPABASE' : 'MOCK'}] Intento de login:`, email);

    // ─────────────────────────────────────────────────────────────────────
    // 1. VALIDACIONES
    // ─────────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────────
    // 2. AUTENTICACIÓN CON SUPABASE O MOCK
    // ─────────────────────────────────────────────────────────────────────

    if (isSupabaseConfigured() && supabase) {
      // Modo Supabase: Autenticación real
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session || !data.user) {
        console.warn('[Supabase Login] Intento fallido:', email, error?.message);
        return new Response(
          JSON.stringify({ error: 'Email o contraseña incorrectos' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Establecer cookies de sesión
      setSessionCookies(
        cookies,
        data.session.access_token,
        data.session.refresh_token,
        data.session.expires_in || 3600
      );

      // Obtener perfil del empleador
      const { data: empleadorData } = await supabase
        .from('empleadores')
        .select('empresa')
        .eq('id', data.user.id)
        .single();

      console.log('[Supabase Login] Sesión iniciada:', data.user.email);

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            nombre_empresa: (empleadorData as any)?.empresa || 'Sin nombre'
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } else {
      // Modo Mock: Fallback para desarrollo
      const user = mockLogin(email, password);

      if (!user) {
        console.warn('[Login Mock] Intento fallido:', email);
        return new Response(
          JSON.stringify({ error: 'Email o contraseña incorrectos' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Establecer sesión mock
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
    }

  } catch (error) {
    console.error('[API /auth/login] Error inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
