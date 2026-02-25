export type TipoEmpleo = 'full-time' | 'part-time' | 'freelance' | 'practica';

export interface Database {
  public: {
    Tables: {
      empleadores: {
        Row: {
          id: string;
          email: string;
          empresa: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          empresa: string;
          created_at?: string;
        };
        Update: {
          empresa?: string;
        };
      };
      ofertas: {
        Row: {
          id: string;
          titulo: string;
          descripcion: string;
          empresa: string;
          tipo_empleo: TipoEmpleo;
          categoria: string;
          comuna: string;
          lat: number;
          lng: number;
          activa: boolean;
          expira_en: string;
          empleador_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          descripcion: string;
          empresa: string;
          tipo_empleo: TipoEmpleo;
          categoria: string;
          comuna: string;
          lat: number;
          lng: number;
          activa?: boolean;
          expira_en: string;
          empleador_id: string;
          created_at?: string;
        };
        Update: {
          titulo?: string;
          descripcion?: string;
          tipo_empleo?: TipoEmpleo;
          categoria?: string;
          activa?: boolean;
          expira_en?: string;
        };
      };
      postulaciones: {
        Row: {
          id: string;
          oferta_id: string;
          nombre: string | null;
          email: string | null;
          cv_url: string;
          ip_address: string | null;
          palabras_clave: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          oferta_id: string;
          nombre?: string | null;
          email?: string | null;
          cv_url: string;
          ip_address?: string | null;
          palabras_clave?: string[] | null;
          created_at?: string;
        };
        Update: { palabras_clave?: string[] | null };
      };
    };
  };
}

export type Oferta = Database['public']['Tables']['ofertas']['Row'];
export type Postulacion = Database['public']['Tables']['postulaciones']['Row'];
export type Empleador = Database['public']['Tables']['empleadores']['Row'];
