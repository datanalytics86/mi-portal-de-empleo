import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase');
}

// Cliente público (para uso en servidor con la sesión del usuario)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Cliente con service role (solo para API routes del servidor)
export function createServiceClient() {
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');
  return createClient<Database>(supabaseUrl, serviceKey);
}

// Crea un cliente con la cookie de sesión del usuario
export function createServerClient(authToken?: string) {
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    },
  });
  return client;
}
