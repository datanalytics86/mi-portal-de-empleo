/**
 * Cliente de Supabase para uso en el servidor
 *
 * Este cliente usa la SERVICE_ROLE_KEY que bypasea las políticas RLS.
 * SOLO debe usarse en API routes del servidor, NUNCA en código del cliente.
 *
 * Úsalo para:
 * - Operaciones administrativas
 * - Bypass de RLS cuando sea necesario
 * - Operaciones de backend que requieren privilegios elevados
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase Admin. ' +
    'Asegúrate de configurar PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
  )
}

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

console.log('✅ Supabase Admin client inicializado')
