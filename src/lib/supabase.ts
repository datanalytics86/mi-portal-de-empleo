import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

// Validar variables de entorno
if (!import.meta.env.PUBLIC_SUPABASE_URL) {
  throw new Error('PUBLIC_SUPABASE_URL no está configurada');
}

if (!import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('PUBLIC_SUPABASE_ANON_KEY no está configurada');
}

/**
 * Cliente de Supabase para uso en el cliente (browser)
 * Usa la Anon Key que tiene acceso limitado según RLS policies
 */
export const supabase = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Cliente de Supabase para uso en el servidor
 * Usa la Service Role Key que tiene acceso completo
 * SOLO USAR EN EL SERVIDOR, NUNCA EXPONER AL CLIENTE
 */
export function createServerClient() {
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada');
  }

  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Verifica si hay una sesión activa
 */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error al obtener sesión:', error);
    return null;
  }

  return session;
}

/**
 * Obtiene el usuario actual
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error al obtener usuario:', error);
    return null;
  }

  return user;
}

/**
 * Cierra la sesión del usuario
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error al cerrar sesión:', error);
    return { success: false, error };
  }

  return { success: true };
}
