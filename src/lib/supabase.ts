/**
 * Cliente de Supabase para uso en el navegador
 *
 * Este cliente usa las claves públicas (ANON_KEY) y es seguro
 * para usar en código del cliente. Respeta las políticas RLS.
 *
 * Si las variables de entorno no están configuradas, retorna null
 * para permitir que la aplicación funcione con datos mock.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase no configurado. Variables PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY no encontradas.')
  console.warn('   La aplicación funcionará con datos mock.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

// Helper para verificar si Supabase está configurado
export const isSupabaseConfigured = () => supabase !== null

// Log inicial
if (typeof window !== 'undefined' && supabase) {
  console.log('✅ Supabase client inicializado')
}
