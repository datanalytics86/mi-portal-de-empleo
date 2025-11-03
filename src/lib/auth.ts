/**
 * Utilidades de autenticación con Supabase
 *
 * Maneja sesiones de usuario usando cookies HTTP-only para seguridad.
 * Compatible con SSR de Astro y funciona con fallback a datos mock.
 */

import type { AstroCookies } from 'astro';
import { supabase } from './supabase';

/**
 * Obtiene la sesión actual del usuario desde las cookies
 */
export async function getSession(cookies: AstroCookies) {
  // Si Supabase no está configurado, retornar sin sesión
  if (!supabase) {
    return { session: null, user: null };
  }

  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) {
    return { session: null, user: null };
  }

  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      // Limpiar cookies inválidas
      clearSessionCookies(cookies);
      return { session: null, user: null };
    }

    // Si la sesión fue refrescada, actualizar cookies
    if (data.session.access_token !== accessToken) {
      setSessionCookies(
        cookies,
        data.session.access_token,
        data.session.refresh_token,
        data.session.expires_in || 3600
      );
    }

    return { session: data.session, user: data.user };
  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    clearSessionCookies(cookies);
    return { session: null, user: null };
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export async function isAuthenticated(cookies: AstroCookies): Promise<boolean> {
  const { session } = await getSession(cookies);
  return session !== null;
}

/**
 * Obtiene el perfil del empleador actual
 */
export async function getEmpleadorProfile(cookies: AstroCookies) {
  if (!supabase) {
    return null;
  }

  const { user } = await getSession(cookies);

  if (!user) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('empleadores')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error al obtener perfil empleador:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo perfil empleador:', error);
    return null;
  }
}

/**
 * Obtiene el ID del usuario autenticado
 * Retorna null si no hay sesión
 */
export async function getUserId(cookies: AstroCookies): Promise<string | null> {
  const { user } = await getSession(cookies);
  return user?.id || null;
}

/**
 * Verifica si el usuario está autenticado y requiere auth
 * Útil para proteger rutas
 */
export async function requireAuth(cookies: AstroCookies): Promise<boolean> {
  const { user } = await getSession(cookies);
  return user !== null;
}

/**
 * Establece las cookies de sesión
 */
export function setSessionCookies(
  cookies: AstroCookies,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const maxAge = expiresIn;

  cookies.set('sb-access-token', accessToken, {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
  });

  cookies.set('sb-refresh-token', refreshToken, {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
  });
}

/**
 * Elimina las cookies de sesión
 */
export function clearSessionCookies(cookies: AstroCookies) {
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
}

/**
 * Valida el formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida la fortaleza de la contraseña
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  return { valid: true };
}

/**
 * Tipo para el perfil del empleador
 */
export interface EmpleadorProfile {
  id: string;
  email: string;
  nombre_empresa: string;
  created_at: string;
}
