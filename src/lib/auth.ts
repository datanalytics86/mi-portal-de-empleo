import type { AstroCookies } from 'astro';
import { supabaseServer } from './supabase';

/**
 * Obtiene la sesión actual del usuario desde las cookies
 */
export async function getSession(cookies: AstroCookies) {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) {
    return { session: null, user: null };
  }

  const { data, error } = await supabaseServer.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error('Error al restaurar sesión:', error.message);
    return { session: null, user: null };
  }

  return { session: data.session, user: data.user };
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
  const { user } = await getSession(cookies);

  if (!user) {
    return null;
  }

  const { data, error } = await supabaseServer
    .from('empleadores')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error al obtener perfil empleador:', error.message);
    return null;
  }

  return data;
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
