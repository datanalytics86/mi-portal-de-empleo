/**
 * API Route: Registro de Empleador
 *
 * Registra nuevos empleadores usando Supabase Auth o sistema mock (fallback)
 * Si Supabase está configurado: Crea usuario en auth.users + registro en tabla empleadores
 * Si NO está configurado: Usa modo mock (solo para desarrollo)
 */

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { setSessionCookies, isValidEmail, isValidPassword } from '../../../lib/auth';
import { mockRegister, setMockSession } from '../../../lib/mock-auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password, nombreEmpresa, nombre, telefono } = await request.json();

    console.log(`[API /auth/registro ${isSupabaseConfigured() ? 'SUPABASE' : 'MOCK'}] Nuevo registro:`, email);

    // ─────────────────────────────────────────────────────────────────────
    // 1. VALIDACIONES
    // ─────────────────────────────────────────────────────────────────────

    if (!email || !password || !nombreEmpresa) {
      return new Response(
        JSON.stringify({ error: 'Email, contraseña y nombre de empresa son requeridos' }),
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

    // ─────────────────────────────────────────────────────────────────────
    // 2. REGISTRO CON SUPABASE O MOCK
    // ─────────────────────────────────────────────────────────────────────

    if (isSupabaseConfigured() && supabase) {
      // Modo Supabase: Registro real

      // Paso 1: Crear usuario en auth.users
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            empresa: nombreEmpresa.trim()
          }
        }
      });

      if (error) {
        console.error('[Supabase Registro] Error creando usuario:', error.message);

        // Manejar errores específicos
        if (error.message.includes('already registered')) {
          return new Response(
            JSON.stringify({ error: 'El email ya está registrado' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!data.user) {
        return new Response(
          JSON.stringify({ error: 'Error al crear usuario' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Paso 2: Crear registro en tabla empleadores
      const { error: empleadorError } = await (supabaseAdmin as any)
        .from('empleadores')
        .insert({
          id: data.user.id,
          nombre: nombre || nombreEmpresa.trim(),
          empresa: nombreEmpresa.trim(),
          telefono: telefono || null
        });

      if (empleadorError) {
        console.error('[Supabase Registro] Error creando empleador:', empleadorError);

        // Si falla, intentar eliminar el usuario de auth (rollback)
        try {
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        } catch (cleanupError) {
          console.error('[Supabase Registro] Error en rollback:', cleanupError);
        }

        return new Response(
          JSON.stringify({ error: 'Error al crear perfil de empleador' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Paso 3: Si hay sesión, establecer cookies (auto-login)
      if (data.session) {
        setSessionCookies(
          cookies,
          data.session.access_token,
          data.session.refresh_token,
          data.session.expires_in || 3600
        );
      }

      console.log('[Supabase Registro] Usuario creado:', data.user.email);

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            nombre_empresa: nombreEmpresa.trim()
          },
          message: data.session
            ? 'Registro exitoso. Sesión iniciada automáticamente.'
            : 'Registro exitoso. Por favor verifica tu email antes de iniciar sesión.'
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );

    } else {
      // Modo Mock: Fallback para desarrollo
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
    }

  } catch (error) {
    console.error('[API /auth/registro] Error inesperado:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
