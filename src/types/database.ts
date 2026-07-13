export type TipoEmpleo = 'full-time' | 'part-time' | 'freelance' | 'practica';

export type ParseStatus = 'pending' | 'success' | 'failed' | 'skipped';

/** Estructura de cv_parsed (jsonb) — ver src/lib/cv-parser/types.ts */
export interface CvParsedJson {
  nombre_completo: string | null;
  email: string | null;
  telefono: string | null;
  titulo_profesional: string | null;
  resumen: string | null;
  experiencia: Array<{
    empresa: string | null;
    cargo: string | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    descripcion: string | null;
  }>;
  educacion: Array<{
    institucion: string | null;
    titulo: string | null;
    fecha: string | null;
    descripcion: string | null;
  }>;
  skills_tecnicas: string[];
  skills_blandas: string[];
  keywords: string[];
  idiomas: Array<{ idioma: string; nivel: string | null }>;
  anos_experiencia: number | null;
  ubicacion: string | null;
  parse_method: 'rule' | 'llm' | 'hybrid' | 'ocr';
  used_ocr?: boolean;
  ocr_engine?: 'ocr_space' | 'tesseract' | 'none' | null;
  raw_text_length: number;
  warnings: string[];
}

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
          keywords: string[] | null;
          cv_parsed: CvParsedJson | null;
          parse_status: ParseStatus | null;
          parsed_at: string | null;
          match_score: number | null;
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
          keywords?: string[] | null;
          cv_parsed?: CvParsedJson | null;
          parse_status?: ParseStatus | null;
          parsed_at?: string | null;
          match_score?: number | null;
          created_at?: string;
        };
        Update: {
          nombre?: string | null;
          email?: string | null;
          palabras_clave?: string[] | null;
          keywords?: string[] | null;
          cv_parsed?: CvParsedJson | null;
          parse_status?: ParseStatus | null;
          parsed_at?: string | null;
          match_score?: number | null;
        };
      };
    };
  };
}

export type Oferta = Database['public']['Tables']['ofertas']['Row'];
export type Postulacion = Database['public']['Tables']['postulaciones']['Row'];
export type Empleador = Database['public']['Tables']['empleadores']['Row'];
