import type { AstroCookies } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const SESSION_COOKIE = 'sb-session';

export function getSessionFromCookies(cookies: AstroCookies) {
  const token = cookies.get(SESSION_COOKIE)?.value;
  return token || null;
}

export function createAuthedClient(token: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function getEmpleadorSession(cookies: AstroCookies) {
  const token = getSessionFromCookies(cookies);
  if (!token) return null;

  const client = createAuthedClient(token);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;

  const { data: empleador } = await client
    .from('empleadores')
    .select('*')
    .eq('id', user.id)
    .single();

  return empleador ? { user, empleador, token, client } : null;
}

export type EmpleadorSession = NonNullable<Awaited<ReturnType<typeof getEmpleadorSession>>>;

// Duración de la cookie alineada con el TTL del JWT de Supabase (1 hora)
export const SESSION_MAX_AGE = 60 * 60;
