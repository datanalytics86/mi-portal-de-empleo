/**
 * Tipos TypeScript generados para Supabase
 *
 * Estos tipos corresponden al schema de la base de datos
 * y son usados para type-safety en todo el proyecto
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      empleadores: {
        Row: {
          id: string
          nombre: string
          empresa: string
          telefono: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nombre: string
          empresa: string
          telefono?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          empresa?: string
          telefono?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ofertas: {
        Row: {
          id: string
          empleador_id: string
          titulo: string
          descripcion: string
          empresa: string
          ubicacion: Json
          tipo: string
          categoria: string
          salario: Json | null
          requisitos: string[]
          beneficios: string[]
          activa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empleador_id: string
          titulo: string
          descripcion: string
          empresa: string
          ubicacion: Json
          tipo: string
          categoria: string
          salario?: Json | null
          requisitos?: string[]
          beneficios?: string[]
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empleador_id?: string
          titulo?: string
          descripcion?: string
          empresa?: string
          ubicacion?: Json
          tipo?: string
          categoria?: string
          salario?: Json | null
          requisitos?: string[]
          beneficios?: string[]
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      postulaciones: {
        Row: {
          id: string
          oferta_id: string
          nombre: string
          email: string
          telefono: string
          mensaje: string | null
          cv_url: string
          cv_nombre: string
          cv_size: number
          created_at: string
          // Nuevos campos añadidos
          rut: string | null
          telefono_formateado: string | null
          region: string | null
          comuna: string | null
          carrera: string | null
          nivel_estudios: string | null
          anos_experiencia: number | null
          rango_sueldo_esperado: string | null
          disponibilidad: string | null
          linkedin_url: string | null
          portfolio_url: string | null
          github_url: string | null
        }
        Insert: {
          id?: string
          oferta_id: string
          nombre: string
          email: string
          telefono: string
          mensaje?: string | null
          cv_url: string
          cv_nombre: string
          cv_size: number
          created_at?: string
          // Nuevos campos opcionales
          rut?: string | null
          telefono_formateado?: string | null
          region?: string | null
          comuna?: string | null
          carrera?: string | null
          nivel_estudios?: string | null
          anos_experiencia?: number | null
          rango_sueldo_esperado?: string | null
          disponibilidad?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          github_url?: string | null
        }
        Update: {
          id?: string
          oferta_id?: string
          nombre?: string
          email?: string
          telefono?: string
          mensaje?: string | null
          cv_url?: string
          cv_nombre?: string
          cv_size?: number
          created_at?: string
          // Nuevos campos opcionales
          rut?: string | null
          telefono_formateado?: string | null
          region?: string | null
          comuna?: string | null
          carrera?: string | null
          nivel_estudios?: string | null
          anos_experiencia?: number | null
          rango_sueldo_esperado?: string | null
          disponibilidad?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          github_url?: string | null
        }
      }
    }
  }
}

// Tipos auxiliares para facilitar el uso
export type Empleador = Database['public']['Tables']['empleadores']['Row']
export type EmpleadorInsert = Database['public']['Tables']['empleadores']['Insert']
export type EmpleadorUpdate = Database['public']['Tables']['empleadores']['Update']

export type Oferta = Database['public']['Tables']['ofertas']['Row']
export type OfertaInsert = Database['public']['Tables']['ofertas']['Insert']
export type OfertaUpdate = Database['public']['Tables']['ofertas']['Update']

export type Postulacion = Database['public']['Tables']['postulaciones']['Row']
export type PostulacionInsert = Database['public']['Tables']['postulaciones']['Insert']
export type PostulacionUpdate = Database['public']['Tables']['postulaciones']['Update']

// Tipos para la ubicación (almacenada como JSONB)
export interface UbicacionData {
  region: string
  comuna: string
  direccion?: string
  lat?: number
  lng?: number
}

// Tipos para salario (almacenado como JSONB)
export interface SalarioData {
  minimo?: number
  maximo?: number
  moneda: string
  periodo: 'hora' | 'dia' | 'semana' | 'mes' | 'año'
}
