/**
 * Supabase Edge Function: parse-cv
 *
 * Extrae metadatos de un CV PDF usando Claude AI
 *
 * Flujo:
 * 1. Recibe postulacionId y cvPath
 * 2. Descarga PDF de Supabase Storage
 * 3. Extrae texto del PDF
 * 4. Envía a Claude 3.5 Sonnet para parsing
 * 5. Guarda metadatos estructurados en tabla cv_metadata
 *
 * Invocación:
 * POST /functions/v1/parse-cv
 * Body: { "postulacionId": "uuid", "cvPath": "cvs/..." }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.9.1'

// Tipos
interface RequestBody {
  postulacionId: string
  cvPath: string
}

interface CVMetadata {
  nombre_completo: string | null
  email_extraido: string | null
  telefono_extraido: string | null
  titulo_profesional: string | null
  resumen: string | null
  anos_experiencia: number | null
  habilidades: string[]
  idiomas: Array<{ idioma: string; nivel: string }>
  experiencia: Array<{
    empresa: string
    cargo: string
    desde: string
    hasta: string
    descripcion: string
  }>
  educacion: Array<{
    institucion: string
    titulo: string
    desde: string
    hasta: string
  }>
  certificaciones: string[]
}

serve(async (req: Request) => {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // 1. VALIDACIÓN Y SETUP
    // ─────────────────────────────────────────────────────────────────────

    // Solo permitir POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Leer body
    const { postulacionId, cvPath }: RequestBody = await req.json()

    if (!postulacionId || !cvPath) {
      return new Response(
        JSON.stringify({ error: 'postulacionId and cvPath are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[parse-cv] Processing CV for postulacion: ${postulacionId}`)

    // Inicializar Supabase Client (con Service Role Key)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Inicializar Anthropic Client
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    // ─────────────────────────────────────────────────────────────────────
    // 2. DESCARGAR PDF DE STORAGE
    // ─────────────────────────────────────────────────────────────────────

    console.log(`[parse-cv] Downloading PDF from: ${cvPath}`)

    const { data: pdfBlob, error: downloadError } = await supabase.storage
      .from('archivos')
      .download(cvPath)

    if (downloadError || !pdfBlob) {
      console.error('[parse-cv] Error downloading PDF:', downloadError)
      throw new Error(`Failed to download PDF: ${downloadError?.message}`)
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. EXTRAER TEXTO DEL PDF
    // ─────────────────────────────────────────────────────────────────────

    console.log('[parse-cv] Extracting text from PDF...')

    // Para Deno, podemos usar pdf-parse-deno o similar
    // Por simplicidad, aquí mostramos el concepto
    // En producción, usa una librería como pdf-parse

    const pdfText = await extractTextFromPDF(pdfBlob)

    if (!pdfText || pdfText.length < 50) {
      console.warn('[parse-cv] PDF text extraction failed or empty')
      throw new Error('PDF appears to be empty or unreadable')
    }

    console.log(`[parse-cv] Extracted ${pdfText.length} characters`)

    // ─────────────────────────────────────────────────────────────────────
    // 4. ENVIAR A CLAUDE PARA PARSING
    // ─────────────────────────────────────────────────────────────────────

    console.log('[parse-cv] Sending to Claude AI for parsing...')

    const prompt = `Eres un experto en recursos humanos. Extrae información estructurada de este CV en español.

IMPORTANTE: Responde ÚNICAMENTE con JSON válido, sin texto adicional antes o después.

CV:
${pdfText}

Extrae la siguiente información y responde en formato JSON:
{
  "nombre_completo": "string (nombre completo del candidato)",
  "email_extraido": "string (email si aparece en el CV)",
  "telefono_extraido": "string (teléfono chileno en formato +56...)",
  "titulo_profesional": "string (título profesional o cargo actual)",
  "resumen": "string (resumen profesional, máximo 500 caracteres)",
  "anos_experiencia": number (años totales de experiencia laboral),
  "habilidades": ["array", "de", "habilidades", "técnicas", "y", "profesionales"],
  "idiomas": [
    {"idioma": "Español", "nivel": "Nativo"},
    {"idioma": "Inglés", "nivel": "Avanzado (C1)"}
  ],
  "experiencia": [
    {
      "empresa": "string",
      "cargo": "string",
      "desde": "YYYY-MM",
      "hasta": "YYYY-MM o 'presente'",
      "descripcion": "string (breve descripción)"
    }
  ],
  "educacion": [
    {
      "institucion": "string",
      "titulo": "string",
      "desde": "YYYY",
      "hasta": "YYYY"
    }
  ],
  "certificaciones": ["array", "de", "certificaciones"]
}

Reglas:
- Si un campo no está disponible, usa null o array vacío
- Para años de experiencia, suma todos los períodos laborales
- Normaliza habilidades a nombres estándar (ej: "Javascript" → "JavaScript")
- Niveles de idiomas: Básico, Intermedio, Avanzado, Nativo
- Responde SOLO con el JSON, sin explicaciones`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.3, // Baja temperatura para respuestas más determinísticas
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // Extraer texto de la respuesta de Claude
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('[parse-cv] Claude response received')

    // Parsear JSON (puede venir con markdown ```json, limpiar)
    let metadata: CVMetadata
    try {
      const cleanJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()

      metadata = JSON.parse(cleanJson)
      console.log('[parse-cv] Successfully parsed metadata')
    } catch (parseError) {
      console.error('[parse-cv] Error parsing Claude response:', parseError)
      console.error('Raw response:', responseText)
      throw new Error('Failed to parse AI response as JSON')
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. CALCULAR SCORE DE CONFIANZA
    // ─────────────────────────────────────────────────────────────────────

    const confianzaScore = calculateConfidenceScore(metadata)

    // ─────────────────────────────────────────────────────────────────────
    // 6. GUARDAR EN BASE DE DATOS
    // ─────────────────────────────────────────────────────────────────────

    console.log('[parse-cv] Saving metadata to database...')

    const { data: insertData, error: insertError } = await supabase
      .from('cv_metadata')
      .upsert(
        {
          postulacion_id: postulacionId,
          nombre_completo: metadata.nombre_completo,
          email_extraido: metadata.email_extraido,
          telefono_extraido: metadata.telefono_extraido,
          titulo_profesional: metadata.titulo_profesional,
          resumen: metadata.resumen,
          anos_experiencia: metadata.anos_experiencia,
          habilidades: metadata.habilidades || [],
          idiomas: metadata.idiomas || [],
          experiencia: metadata.experiencia || [],
          educacion: metadata.educacion || [],
          certificaciones: metadata.certificaciones || [],
          texto_completo: pdfText.substring(0, 50000), // Limitar a 50K chars
          confianza_score: confianzaScore,
          modelo_usado: 'claude-3-5-sonnet-20241022',
          parsed_at: new Date().toISOString()
        },
        {
          onConflict: 'postulacion_id', // Actualizar si ya existe
          ignoreDuplicates: false
        }
      )
      .select()

    if (insertError) {
      console.error('[parse-cv] Error saving to database:', insertError)
      throw new Error(`Database error: ${insertError.message}`)
    }

    console.log('[parse-cv] ✅ Successfully parsed and saved CV metadata')

    // ─────────────────────────────────────────────────────────────────────
    // 7. RESPUESTA EXITOSA
    // ─────────────────────────────────────────────────────────────────────

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          postulacionId,
          metadata,
          confianzaScore,
          extractedChars: pdfText.length
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('[parse-cv] Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

// ═════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═════════════════════════════════════════════════════════════════════════

/**
 * Extrae texto de un PDF Blob
 * NOTA: En producción, usar una librería robusta como pdf-parse
 */
async function extractTextFromPDF(pdfBlob: Blob): Promise<string> {
  // TODO: Implementar extracción real de PDF
  // Opciones:
  // 1. pdf-parse-deno
  // 2. Llamar a servicio externo
  // 3. Usar OCR si es imagen escaneada

  // Por ahora, placeholder (en producción reemplazar)
  const arrayBuffer = await pdfBlob.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  // Intento simple: buscar texto plano en PDF (NO ROBUSTO)
  const decoder = new TextDecoder('utf-8', { fatal: false })
  let text = decoder.decode(uint8Array)

  // Limpiar caracteres especiales de PDF
  text = text
    .replace(/[^\x20-\x7E\u00C0-\u017F\n]/g, ' ') // Solo ASCII + Latin-1
    .replace(/\s+/g, ' ') // Espacios múltiples
    .trim()

  // Si el texto es muy corto, probablemente el PDF es imagen (necesita OCR)
  if (text.length < 100) {
    throw new Error(
      'PDF appears to be scanned image. OCR processing not implemented yet.'
    )
  }

  return text
}

/**
 * Calcula score de confianza basado en completitud de datos
 */
function calculateConfidenceScore(metadata: CVMetadata): number {
  let score = 0
  let maxScore = 0

  // Nombre (peso: 15)
  maxScore += 15
  if (metadata.nombre_completo) score += 15

  // Email (peso: 10)
  maxScore += 10
  if (metadata.email_extraido) score += 10

  // Título profesional (peso: 10)
  maxScore += 10
  if (metadata.titulo_profesional) score += 10

  // Años de experiencia (peso: 15)
  maxScore += 15
  if (metadata.anos_experiencia && metadata.anos_experiencia > 0) score += 15

  // Habilidades (peso: 20)
  maxScore += 20
  if (metadata.habilidades && metadata.habilidades.length > 0) {
    score += Math.min(20, metadata.habilidades.length * 2)
  }

  // Experiencia laboral (peso: 15)
  maxScore += 15
  if (metadata.experiencia && metadata.experiencia.length > 0) {
    score += Math.min(15, metadata.experiencia.length * 5)
  }

  // Educación (peso: 10)
  maxScore += 10
  if (metadata.educacion && metadata.educacion.length > 0) {
    score += Math.min(10, metadata.educacion.length * 5)
  }

  // Idiomas (peso: 5)
  maxScore += 5
  if (metadata.idiomas && metadata.idiomas.length > 0) score += 5

  return Math.round((score / maxScore) * 100) / 100
}

/* Para Deno Deploy */
