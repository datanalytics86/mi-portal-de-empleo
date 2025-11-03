/**
 * API Route: Postular a Oferta
 *
 * Maneja la postulación a ofertas con Supabase o modo mock
 * Basado en SPECIFICATIONS.md secciones 8.1, 8.2, 9
 *
 * Si Supabase está configurado: Guarda en DB, sube CV, envía emails
 * Si NO está configurado: Usa modo mock (solo para desarrollo)
 */

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { uploadCV, validateCV } from '../../lib/storage';
import { enviarEmailPostulacion, enviarEmailEmpleador } from '../../lib/email';
import { findOfertaById } from '../../data/mock-ofertas';
import {
  validateCVFileServer,
  generateUniqueCVFileName,
  MAX_POSTULATIONS_PER_HOUR,
  ALLOWED_CV_TYPES,
  MAX_CV_SIZE,
} from '../../lib/validations';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA STORAGE (only used if Supabase is not configured)
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

    console.log(`[API /postular ${isSupabaseConfigured() ? 'SUPABASE' : 'MOCK'}] Nueva postulación desde IP:`, clientIP);

    // ─────────────────────────────────────────────────────────────────────
    // 2. RATE LIMITING - Máximo 3 postulaciones por hora
    // ─────────────────────────────────────────────────────────────────────

    if (isSupabaseConfigured()) {
      // Rate limiting con Supabase
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

      // No usamos el cliente aquí porque RLS no aplica para contar por IP
      // En producción, considera usar Upstash Redis para rate limiting
      console.log('[Rate Limit] Verificando en mock mode (TODO: Implementar con Redis)');
    }

    // Fallback: Rate limiting en memoria (desarrollo)
    const oneHourAgo = Date.now() - 3600000;
    const recentPostulations = postulaciones.filter(
      p => p.timestamp > oneHourAgo && p.ip === clientIP
    );

    if (recentPostulations.length >= MAX_POSTULATIONS_PER_HOUR) {
      console.warn(`[Rate Limit] IP ${clientIP} excedió límite (${recentPostulations.length} postulaciones en 1h)`);
      return new Response(
        JSON.stringify({
          error: 'Has alcanzado el límite de postulaciones por hora. Intenta más tarde.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. PARSEAR FORMDATA
    // ─────────────────────────────────────────────────────────────────────

    const formData = await request.formData();

    const oferta_id = formData.get('oferta_id') as string;
    const nombre = (formData.get('nombre_candidato') as string) || '';
    const email = (formData.get('email_candidato') as string) || '';
    const telefono = (formData.get('telefono') as string) || '';
    const mensaje = (formData.get('mensaje') as string) || null;
    const cvFile = formData.get('cv') as File;

    // Validar campos requeridos
    if (!oferta_id) {
      return new Response(
        JSON.stringify({ error: 'ID de oferta es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!nombre || !email || !telefono) {
      return new Response(
        JSON.stringify({ error: 'Nombre, email y teléfono son requeridos' }),
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
      nombre,
      email,
      telefono,
      cv_filename: cvFile.name,
      cv_size: cvFile.size,
      cv_type: cvFile.type,
    });

    // ─────────────────────────────────────────────────────────────────────
    // 4. VALIDAR OFERTA EXISTE Y ESTÁ ACTIVA
    // ─────────────────────────────────────────────────────────────────────

    let oferta: any;
    let empleadorEmail: string | null = null;

    if (isSupabaseConfigured() && supabase) {
      // Validar con Supabase
      const { data, error } = await supabase
        .from('ofertas')
        .select('id, titulo, empresa, activa, empleador_id')
        .eq('id', oferta_id)
        .eq('activa', true)
        .single();

      if (error || !data) {
        console.error('[Validación Supabase] Oferta no encontrada o inactiva:', oferta_id);
        return new Response(
          JSON.stringify({ error: 'Oferta no encontrada o no está activa' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      oferta = data;

      // Obtener email del empleador para notificación
      const { data: empleadorData } = await supabaseAdmin
        .from('empleadores')
        .select('id')
        .eq('id', oferta.empleador_id)
        .single();

      if (empleadorData) {
        // Obtener email del auth.users
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById((empleadorData as any).id);
        empleadorEmail = userData.user?.email || null;
      }

    } else {
      // Validar con mock data
      const mockOferta = findOfertaById(oferta_id);

      if (!mockOferta) {
        console.error('[Validación MOCK] Oferta no encontrada:', oferta_id);
        return new Response(
          JSON.stringify({ error: 'Oferta no encontrada' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!mockOferta.activa) {
        console.warn('[Validación MOCK] Oferta inactiva:', oferta_id);
        return new Response(
          JSON.stringify({ error: 'Esta oferta ya no está activa' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      oferta = mockOferta;
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. VALIDAR ARCHIVO CV
    // ─────────────────────────────────────────────────────────────────────

    const cvValidation = validateCV(cvFile);
    if (!cvValidation.valid) {
      console.error('[Validación] Archivo CV inválido:', cvValidation.error);
      return new Response(
        JSON.stringify({ error: cvValidation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 6. SUBIR CV Y GUARDAR POSTULACIÓN
    // ─────────────────────────────────────────────────────────────────────

    let postulacionId: string;
    let cvUrl: string;

    if (isSupabaseConfigured()) {
      // Modo Supabase: Guardar en DB y subir CV
      try {
        // Primero, crear el registro de postulación para obtener el ID
        const { data: postulacionData, error: postulacionError } = await (supabaseAdmin as any)
          .from('postulaciones')
          .insert({
            oferta_id,
            nombre,
            email,
            telefono,
            mensaje,
            cv_url: 'pending', // Temporal, se actualizará después
            cv_nombre: cvFile.name,
            cv_size: cvFile.size
          })
          .select('id')
          .single();

        if (postulacionError || !postulacionData) {
          console.error('[Supabase] Error creando postulación:', postulacionError);

          // Check for unique constraint violation (duplicate email)
          if (postulacionError?.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'Ya has postulado a esta oferta anteriormente' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          throw new Error('Error al crear postulación');
        }

        postulacionId = (postulacionData as any).id;

        // Subir CV a Storage
        const cvData = await uploadCV(cvFile, postulacionId);
        cvUrl = cvData.url;

        // Actualizar la postulación con la URL real del CV
        const { error: updateError } = await (supabaseAdmin as any)
          .from('postulaciones')
          .update({ cv_url: cvData.path })
          .eq('id', postulacionId);

        if (updateError) {
          console.error('[Supabase] Error actualizando URL del CV:', updateError);
        }

        console.log('[Supabase] Postulación guardada:', postulacionId);

      } catch (error) {
        console.error('[Supabase] Error en proceso de postulación:', error);
        return new Response(
          JSON.stringify({ error: 'Error al procesar la postulación' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

    } else {
      // Modo Mock: Simular
      postulacionId = `mock-${Date.now()}`;
      cvUrl = `mock://storage/${oferta_id}/${generateUniqueCVFileName(cvFile.name)}`;

      const mockPostulacion: MockPostulacion = {
        ip: clientIP,
        timestamp: Date.now(),
        oferta_id
      };

      postulaciones.push(mockPostulacion);
      console.log('[MOCK] Postulación simulada:', postulacionId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 7. ENVIAR EMAILS DE NOTIFICACIÓN
    // ─────────────────────────────────────────────────────────────────────

    try {
      // Email al candidato
      await enviarEmailPostulacion({
        nombrePostulante: nombre,
        emailPostulante: email,
        tituloOferta: oferta.titulo,
        empresa: oferta.empresa
      });

      // Email al empleador (si tenemos su email)
      if (empleadorEmail) {
        await enviarEmailEmpleador({
          nombrePostulante: nombre,
          emailEmpleador: empleadorEmail,
          tituloOferta: oferta.titulo,
          empresa: oferta.empresa,
          dashboardUrl: `${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/empleador/oferta/${oferta_id}/postulaciones`
        });
      }
    } catch (emailError) {
      // Los emails son nice-to-have, no bloquean la postulación
      console.error('[Email] Error enviando notificaciones:', emailError);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 8. RESPUESTA EXITOSA
    // ─────────────────────────────────────────────────────────────────────

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Postulación enviada exitosamente',
        postulacion: {
          id: postulacionId,
          created_at: new Date().toISOString(),
        },
      }),
      {
        status: 201,
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
