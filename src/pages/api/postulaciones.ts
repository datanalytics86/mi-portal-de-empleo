import type { APIRoute } from 'astro';
import { createServiceClient } from '../../lib/supabase';
import { z } from 'zod';

const MAX_CV_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora

// Rate limiting en memoria (suficiente para un solo proceso; usar Redis en producción)
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

const PostulacionSchema = z.object({
  oferta_id: z.string().uuid('ID de oferta inválido'),
  nombre: z.string().max(100).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
});

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('cf-connecting-ip')
    || 'unknown';

  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Demasiadas postulaciones. Espera una hora antes de intentarlo de nuevo.' }), {
      status: 429, headers: { 'Content-Type': 'application/json' },
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Datos inválidos.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = PostulacionSchema.safeParse({
    oferta_id: form.get('oferta_id'),
    nombre: form.get('nombre') || null,
    email: form.get('email') || null,
  });

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.errors[0]?.message || 'Datos inválidos.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const cv = form.get('cv') as File | null;
  if (!cv || cv.size === 0) {
    return new Response(JSON.stringify({ error: 'Debes adjuntar tu CV.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (cv.size > MAX_CV_SIZE) {
    return new Response(JSON.stringify({ error: 'El CV supera el tamaño máximo de 5MB.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!ALLOWED_TYPES.includes(cv.type)) {
    return new Response(JSON.stringify({ error: 'Solo se aceptan archivos PDF o Word.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const serviceClient = createServiceClient();

  // Verificar que la oferta existe y está activa
  const { data: oferta } = await serviceClient
    .from('ofertas')
    .select('id')
    .eq('id', parsed.data.oferta_id)
    .eq('activa', true)
    .gte('expira_en', new Date().toISOString())
    .single();

  if (!oferta) {
    return new Response(JSON.stringify({ error: 'La oferta no está disponible.' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Subir CV a Supabase Storage
  const ext = cv.name.split('.').pop() || 'pdf';
  const fileName = `${parsed.data.oferta_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const cvBuffer = await cv.arrayBuffer();

  const { data: uploadData, error: uploadError } = await serviceClient.storage
    .from('cvs')
    .upload(fileName, cvBuffer, {
      contentType: cv.type,
      upsert: false,
    });

  if (uploadError || !uploadData) {
    console.error('Error subiendo CV:', uploadError);
    return new Response(JSON.stringify({ error: 'Error al subir el CV. Intenta de nuevo.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Insertar postulación en la base de datos
  const { error: dbError } = await serviceClient.from('postulaciones').insert({
    oferta_id: parsed.data.oferta_id,
    nombre: parsed.data.nombre || null,
    email: parsed.data.email || null,
    cv_url: uploadData.path,
    ip_address: ip,
  });

  if (dbError) {
    // Limpiar el CV subido si falla la inserción
    await serviceClient.storage.from('cvs').remove([fileName]);
    console.error('Error guardando postulación:', dbError);
    return new Response(JSON.stringify({ error: 'Error al guardar la postulación. Intenta de nuevo.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
