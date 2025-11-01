/**
 * Cliente Supabase para Portal de Empleos Chile
 *
 * Proporciona dos clientes:
 * - supabase: Cliente público para uso en navegador (usa ANON_KEY)
 * - supabaseServer: Cliente con privilegios elevados para operaciones del servidor (usa SERVICE_ROLE_KEY)
 *
 * Basado en SPECIFICATIONS.md sección 2 y 10
 */

import { createClient } from '@supabase/supabase-js';

// Validar que las variables de entorno existen
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Log warning if environment variables are missing (but don't throw error)
if (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase environment variables not configured. Using placeholder values.');
}

/**
 * Cliente público de Supabase
 * - Usa ANON_KEY con Row Level Security (RLS)
 * - Seguro para uso en el navegador
 * - Para operaciones de lectura pública y operaciones autenticadas
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Cliente de servidor de Supabase
 * - Usa SERVICE_ROLE_KEY que bypasea RLS
 * - SOLO para uso en el servidor (API routes, getStaticProps, etc.)
 * - NUNCA exponer al cliente
 */
if (!supabaseServiceKey) {
  console.warn(
    'Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Server-side authentication features will be limited.'
  );
}

export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey, // Fallback to ANON_KEY if SERVICE_ROLE_KEY is not available
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Tipos de la base de datos (generados desde Supabase CLI o manualmente)
// TODO: Generar con `npx supabase gen types typescript --project-id <PROJECT_ID>`

export type Database = {
  public: {
    Tables: {
      empleadores: {
        Row: {
          id: string;
          email: string;
          nombre_empresa: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          nombre_empresa: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nombre_empresa?: string;
          created_at?: string;
        };
      };
      ofertas: {
        Row: {
          id: string;
          empleador_id: string;
          titulo: string;
          descripcion: string;
          empresa: string;
          tipo_jornada: 'Full-time' | 'Part-time' | 'Freelance' | 'Práctica';
          categoria: string | null;
          comuna: string;
          ubicacion: unknown; // PostGIS GEOGRAPHY type
          activa: boolean;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          empleador_id: string;
          titulo: string;
          descripcion: string;
          empresa: string;
          tipo_jornada: 'Full-time' | 'Part-time' | 'Freelance' | 'Práctica';
          categoria?: string | null;
          comuna: string;
          ubicacion: unknown;
          activa?: boolean;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          empleador_id?: string;
          titulo?: string;
          descripcion?: string;
          empresa?: string;
          tipo_jornada?: 'Full-time' | 'Part-time' | 'Freelance' | 'Práctica';
          categoria?: string | null;
          comuna?: string;
          ubicacion?: unknown;
          activa?: boolean;
          created_at?: string;
          expires_at?: string;
        };
      };
      postulaciones: {
        Row: {
          id: string;
          oferta_id: string;
          nombre_candidato: string | null;
          email_candidato: string | null;
          cv_url: string;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          oferta_id: string;
          nombre_candidato?: string | null;
          email_candidato?: string | null;
          cv_url: string;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          oferta_id?: string;
          nombre_candidato?: string | null;
          email_candidato?: string | null;
          cv_url?: string;
          ip_address?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

// Helper types
export type Empleador = Database['public']['Tables']['empleadores']['Row'];
export type Oferta = Database['public']['Tables']['ofertas']['Row'];
export type Postulacion = Database['public']['Tables']['postulaciones']['Row'];
