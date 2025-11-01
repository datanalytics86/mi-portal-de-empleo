/**
 * API Route: Postular a Oferta (MOCK VERSION)
 *
 * Maneja la postulación a ofertas: validaciones y simulación
 * Basado en SPECIFICATIONS.md secciones 8.1, 8.2, 9
 *
 * NOTA: Esta es una versión mock que simula el comportamiento
 * sin guardar datos reales. Para producción, integrar con Supabase.
 */

import type { APIRoute } from 'astro';
import { findOfertaById } from '../../data/mock-ofertas';
import {
  validateCVFileServer,
  generateUniqueCVFileName,
  MAX_POSTULATIONS_PER_HOUR,
  ALLOWED_CV_TYPES,
  MAX_CV_SIZE,
} from '../../lib/validations';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA STORAGE (in-memory, resets on server restart)
// ═══════════════════════════════════════════════════════════════════════════

interface MockPostulacion {
  ip: string;
  timestamp: number;
  oferta_id: string;
}

const postulaciones: MockPostulacion[] = [];

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINT: POST /api/postular
// ═══════════════════════════════════════════════════════════════════════════

export const POST: APIRoute = async ({ request }) => {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // 1. OBTENER IP DEL CLIENTE (para rate limiting)
    // ─────────────────────────────────────────────────────────────────────

    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0';

    console.log('[API /postular MOCK] Nueva postulación desde IP:', clientIP);

    // ─────────────────────────────────────────────────────────────────────
    // 2. RATE LIMITING - Máximo 3 postulaciones por hora (MOCK)
    // Basado en SPECS 8.2
    // ─────────────────────────────────────────────────────────────────────

    const oneHourAgo = Date.now() - 3600000;

    // Limpiar postulaciones antiguas (más de 1 hora)
    const recentPostulations = postulaciones.filter(
      p => p.timestamp > oneHourAgo && p.ip === clientIP
    );

    if (recentPostulations.length >= MAX_POSTULATIONS_PER_HOUR) {
      console.warn(`[Rate Limit MOCK] IP ${clientIP} excedió límite (${recentPostulations.length} postulaciones en 1h)`);
      return new Response(
        JSON.stringify({
          error: 'Has alcanzado el límite de postulaciones por hora. Intenta más tarde.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
        {
          status: 429, // Too Many Requests
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. PARSEAR FORMDATA
    // ─────────────────────────────────────────────────────────────────────

    const formData = await request.formData();

    const oferta_id = formData.get('oferta_id') as string;
    const nombre_candidato = (formData.get('nombre_candidato') as string) || null;
    const email_candidato = (formData.get('email_candidato') as string) || null;
    const cvFile = formData.get('cv') as File;

    // Validar campos requeridos
    if (!oferta_id) {
      return new Response(
        JSON.stringify({ error: 'ID de oferta es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!cvFile || !(cvFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Archivo CV es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[API /postular] Datos recibidos:', {
      oferta_id,
      nombre_candidato: nombre_candidato || 'N/A',
      email_candidato: email_candidato || 'N/A',
      cv_filename: cvFile.name,
      cv_size: cvFile.size,
      cv_type: cvFile.type,
    });

    // ─────────────────────────────────────────────────────────────────────
    // 4. VALIDAR OFERTA EXISTE Y ESTÁ ACTIVA (MOCK)
    // ─────────────────────────────────────────────────────────────────────

    const oferta = findOfertaById(oferta_id);

    if (!oferta) {
      console.error('[Validación MOCK] Oferta no encontrada:', oferta_id);
      return new Response(
        JSON.stringify({ error: 'Oferta no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!oferta.activa) {
      console.warn('[Validación MOCK] Oferta inactiva:', oferta_id);
      return new Response(
        JSON.stringify({ error: 'Esta oferta ya no está activa' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si expiró
    if (new Date(oferta.expires_at) < new Date()) {
      console.warn('[Validación MOCK] Oferta expirada:', oferta_id);
      return new Response(
        JSON.stringify({ error: 'Esta oferta ha expirado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. VALIDAR ARCHIVO CV (servidor)
    // Basado en SPECS 8.1
    // ─────────────────────────────────────────────────────────────────────

    const validation = validateCVFileServer(cvFile);
    if (!validation.isValid) {
      console.error('[Validación] Archivo CV inválido:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validación adicional de tipo MIME
    if (!ALLOWED_CV_TYPES.includes(cvFile.type as any)) {
      console.error('[Validación] Tipo MIME no permitido:', cvFile.type);
      return new Response(
        JSON.stringify({ error: 'Tipo de archivo no permitido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validación de tamaño
    if (cvFile.size > MAX_CV_SIZE) {
      const sizeMB = (MAX_CV_SIZE / 1024 / 1024).toFixed(0);
      return new Response(
        JSON.stringify({ error: `El archivo no puede superar ${sizeMB}MB` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 6. SIMULAR UPLOAD CV (MOCK)
    // Basado en SPECS 9
    // ─────────────────────────────────────────────────────────────────────

    // Generar nombre único para el archivo
    const uniqueFileName = generateUniqueCVFileName(cvFile.name);
    const filePath = `${oferta_id}/${uniqueFileName}`;

    console.log('[Storage MOCK] Simulando upload de CV:', filePath);
    console.log('[Storage MOCK] Archivo:', {
      nombre: cvFile.name,
      tamaño: `${(cvFile.size / 1024).toFixed(2)} KB`,
      tipo: cvFile.type
    });

    // ─────────────────────────────────────────────────────────────────────
    // 7. CREAR REGISTRO DE POSTULACIÓN (MOCK - en memoria)
    // ─────────────────────────────────────────────────────────────────────

    const mockPostulacion: MockPostulacion = {
      ip: clientIP,
      timestamp: Date.now(),
      oferta_id
    };

    // Guardar en memoria
    postulaciones.push(mockPostulacion);

    console.log('[Éxito MOCK] Postulación registrada en memoria');
    console.log('[MOCK] Total postulaciones: ', postulaciones.length);

    // ─────────────────────────────────────────────────────────────────────
    // 8. RESPUESTA EXITOSA
    // ─────────────────────────────────────────────────────────────────────

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Postulación enviada exitosamente',
        postulacion: {
          id: `mock-${Date.now()}`,
          created_at: new Date().toISOString(),
        },
      }),
      {
        status: 201, // Created
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[API /postular] Error inesperado:', error);

    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MÉTODOS NO PERMITIDOS
// ═══════════════════════════════════════════════════════════════════════════

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({ error: 'Método no permitido. Usa POST.' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
};
