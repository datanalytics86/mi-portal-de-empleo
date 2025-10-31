/**
 * API Route: Postular a Oferta
 *
 * Maneja la postulación a ofertas: upload de CV, validaciones y rate limiting
 * Basado en SPECIFICATIONS.md secciones 8.1, 8.2, 9
 */

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import {
  validateCVFileServer,
  generateUniqueCVFileName,
  MAX_POSTULATIONS_PER_HOUR,
  ALLOWED_CV_TYPES,
  MAX_CV_SIZE,
} from '../../lib/validations';

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

    console.log('[API /postular] Nueva postulación desde IP:', clientIP);

    // ─────────────────────────────────────────────────────────────────────
    // 2. RATE LIMITING - Máximo 3 postulaciones por hora
    // Basado en SPECS 8.2
    // ─────────────────────────────────────────────────────────────────────

    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const { data: recentPostulations, error: rateLimitError } = await supabase
      .from('postulaciones')
      .select('id')
      .eq('ip_address', clientIP)
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.error('[Rate Limit] Error verificando:', rateLimitError);
    }

    if (recentPostulations && recentPostulations.length >= MAX_POSTULATIONS_PER_HOUR) {
      console.warn(`[Rate Limit] IP ${clientIP} excedió límite (${recentPostulations.length} postulaciones en 1h)`);
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
    // 4. VALIDAR OFERTA EXISTE Y ESTÁ ACTIVA
    // ─────────────────────────────────────────────────────────────────────

    const { data: oferta, error: ofertaError } = await supabase
      .from('ofertas')
      .select('id, titulo, activa, expires_at')
      .eq('id', oferta_id)
      .single();

    if (ofertaError || !oferta) {
      console.error('[Validación] Oferta no encontrada:', oferta_id);
      return new Response(
        JSON.stringify({ error: 'Oferta no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!oferta.activa) {
      console.warn('[Validación] Oferta inactiva:', oferta_id);
      return new Response(
        JSON.stringify({ error: 'Esta oferta ya no está activa' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si expiró
    if (new Date(oferta.expires_at) < new Date()) {
      console.warn('[Validación] Oferta expirada:', oferta_id);
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
    // 6. UPLOAD CV A SUPABASE STORAGE
    // Basado en SPECS 9
    // ─────────────────────────────────────────────────────────────────────

    // Generar nombre único para el archivo
    const uniqueFileName = generateUniqueCVFileName(cvFile.name);
    const filePath = `${oferta_id}/${uniqueFileName}`;

    console.log('[Storage] Subiendo CV:', filePath);

    // Convertir File a ArrayBuffer
    const arrayBuffer = await cvFile.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload a bucket 'cvs'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(filePath, fileBuffer, {
        contentType: cvFile.type,
        cacheControl: '3600',
        upsert: false, // No sobrescribir
      });

    if (uploadError) {
      console.error('[Storage] Error al subir CV:', uploadError);
      return new Response(
        JSON.stringify({
          error: 'Error al subir el archivo. Intenta nuevamente.',
          details: uploadError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Storage] CV subido exitosamente:', uploadData.path);

    // ─────────────────────────────────────────────────────────────────────
    // 7. CREAR REGISTRO DE POSTULACIÓN EN BD
    // ─────────────────────────────────────────────────────────────────────

    const { data: postulacion, error: postulacionError } = await supabase
      .from('postulaciones')
      .insert({
        oferta_id,
        nombre_candidato: nombre_candidato && nombre_candidato.trim() !== '' ? nombre_candidato.trim() : null,
        email_candidato: email_candidato && email_candidato.trim() !== '' ? email_candidato.trim() : null,
        cv_url: uploadData.path,
        ip_address: clientIP,
      })
      .select()
      .single();

    if (postulacionError) {
      console.error('[BD] Error al crear postulación:', postulacionError);

      // Intentar eliminar el CV subido si falló el insert
      await supabase.storage.from('cvs').remove([filePath]);

      return new Response(
        JSON.stringify({
          error: 'Error al registrar la postulación. Intenta nuevamente.',
          details: postulacionError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Éxito] Postulación creada:', postulacion.id);

    // ─────────────────────────────────────────────────────────────────────
    // 8. RESPUESTA EXITOSA
    // ─────────────────────────────────────────────────────────────────────

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Postulación enviada exitosamente',
        postulacion: {
          id: postulacion.id,
          created_at: postulacion.created_at,
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
