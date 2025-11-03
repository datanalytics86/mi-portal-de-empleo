/**
 * Utilidades para el almacenamiento de archivos en Supabase Storage
 *
 * Maneja la subida y descarga de CVs en el bucket 'archivos'
 */

import { supabaseAdmin } from './supabaseAdmin'

/**
 * Sube un archivo CV a Supabase Storage
 *
 * @param file - Archivo a subir
 * @param postulacionId - ID de la postulación (para nombrar el archivo)
 * @returns Información del archivo subido
 */
export async function uploadCV(file: File, postulacionId: string) {
  const fileName = `${postulacionId}-${Date.now()}-${file.name}`
  const filePath = `cvs/${fileName}`

  try {
    const { data, error } = await supabaseAdmin.storage
      .from('archivos')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error subiendo CV:', error)
      throw new Error(`Error al subir el archivo: ${error.message}`)
    }

    // Generar URL firmada válida por 1 año
    const { data: urlData } = await supabaseAdmin.storage
      .from('archivos')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 año

    return {
      path: data.path,
      url: urlData?.signedUrl || '',
      nombre: file.name,
      size: file.size
    }
  } catch (error) {
    console.error('Error en uploadCV:', error)
    throw error
  }
}

/**
 * Obtiene una URL firmada para descargar un CV
 *
 * @param path - Ruta del archivo en Storage
 * @param expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @returns URL firmada para descarga
 */
export async function getSignedUrl(path: string, expiresIn = 3600) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('archivos')
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Error generando URL firmada:', error)
      throw new Error(`Error al generar URL de descarga: ${error.message}`)
    }

    return data?.signedUrl || ''
  } catch (error) {
    console.error('Error en getSignedUrl:', error)
    throw error
  }
}

/**
 * Elimina un archivo CV del Storage
 *
 * @param path - Ruta del archivo a eliminar
 */
export async function deleteCV(path: string) {
  try {
    const { error } = await supabaseAdmin.storage
      .from('archivos')
      .remove([path])

    if (error) {
      console.error('Error eliminando CV:', error)
      throw new Error(`Error al eliminar el archivo: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error('Error en deleteCV:', error)
    throw error
  }
}

/**
 * Valida un archivo CV
 *
 * @param file - Archivo a validar
 * @returns Objeto con validación y mensaje de error si aplica
 */
export function validateCV(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['application/pdf']

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'El archivo debe ser PDF'
    }
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'El archivo no debe superar los 5MB'
    }
  }

  return { valid: true }
}

/**
 * Extrae la ruta del archivo desde una URL firmada
 *
 * @param url - URL firmada de Supabase
 * @returns Ruta del archivo
 */
export function extractPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(/\/object\/sign\/archivos\/(.+)/)
    return pathMatch ? pathMatch[1] : ''
  } catch (error) {
    console.error('Error extrayendo ruta de URL:', error)
    return ''
  }
}
