/**
 * Tipos de la base de datos generados desde el schema de Supabase
 * Para actualizar: npx supabase gen types typescript --project-id <project-id> > src/lib/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
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
          categoria: string;
          comuna: string;
          ubicacion: string; // PostGIS GEOGRAPHY type
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
          categoria: string;
          comuna: string;
          ubicacion: string;
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
          categoria?: string;
          comuna?: string;
          ubicacion?: string;
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
          ip_hash: string; // Cambiado de ip_address a ip_hash
          created_at: string;
        };
        Insert: {
          id?: string;
          oferta_id: string;
          nombre_candidato?: string | null;
          email_candidato?: string | null;
          cv_url: string;
          ip_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          oferta_id?: string;
          nombre_candidato?: string | null;
          email_candidato?: string | null;
          cv_url?: string;
          ip_hash?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Empleador = Database['public']['Tables']['empleadores']['Row'];
export type Oferta = Database['public']['Tables']['ofertas']['Row'];
export type Postulacion = Database['public']['Tables']['postulaciones']['Row'];

export type OfertaConEmpleador = Oferta & {
  empleadores: Pick<Empleador, 'nombre_empresa'>;
};

export type OfertaConPostulaciones = Oferta & {
  postulaciones: Pick<Postulacion, 'id' | 'created_at'>[];
};
