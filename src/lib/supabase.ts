import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente para operaciones del servidor con Service Role Key
export const supabaseAdmin = createClient(
  supabaseUrl,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tipos de base de datos
export interface Empleador {
  id: string;
  email: string;
  nombre_empresa: string;
  created_at: string;
}

export interface Oferta {
  id: string;
  empleador_id: string;
  titulo: string;
  descripcion: string;
  empresa: string;
  tipo_jornada: 'Full-time' | 'Part-time' | 'Freelance' | 'Práctica';
  categoria: string | null;
  comuna: string;
  ubicacion: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  activa: boolean;
  created_at: string;
  expires_at: string;
}

export interface Postulacion {
  id: string;
  oferta_id: string;
  nombre_candidato: string | null;
  email_candidato: string | null;
  cv_url: string;
  ip_address: string | null;
  created_at: string;
}
