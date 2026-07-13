import type { APIRoute } from 'astro';
import { createServiceClient } from '../../lib/supabase';
import {
  parseCv,
  validateCvFile,
  storageExtension,
  MAX_CV_SIZE,
  type CvFormat,
} from '../../lib/cv-parser';
import { z } from 'zod';

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora

// Rate limiting en memoria (suficiente para un solo proceso; usar Redis en multi-instancia)
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  if (rateLimitMap.size > 100) {
    for (const [key, ts] of rateLimitMap) {
      const active = ts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) rateLimitMap.delete(key);
      else rateLimitMap.set(key, active);
    }
  }

  return false;
}

const PostulacionSchema = z.object({
  oferta_id: z.string().uuid('ID de oferta inválido'),
  nombre: z.string().max(100).optional().nullable(),
  email: z
    .union([z.string().email().max(200), z.literal(''), z.null()])
    .optional(),
});

/**
 * Programa trabajo en background sin bloquear la respuesta al candidato.
 * En Vercel usa waitUntil; si no está disponible, fire-and-forget + Edge opcional.
 */
function scheduleBackground(task: Promise<unknown>): void {
  void task.catch((err) => console.error('[postulaciones] background task error:', err));

  try {
    // Dynamic import — no rompe builds locales sin el paquete
    import('@vercel/functions')
      .then((mod) => {
        if (typeof mod.waitUntil === 'function') {
          mod.waitUntil(task);
        }
      })
      .catch(() => {
        /* local / sin @vercel/functions */
      });
  } catch {
    /* ignore */
  }
}

async function runParseInBackground(opts: {
  postulationId: string;
  buffer: ArrayBuffer;
  mimeType: string;
  fileName: string;
  format: CvFormat;
  formNombre: string | null;
  formEmail: string | null;
  ofertaTexto: string;
}): Promise<void> {
  const serviceClient = createServiceClient();

  try {
    const result = await parseCv({
      buffer: opts.buffer,
      mimeType: opts.mimeType,
      fileName: opts.fileName,
      format: opts.format,
      formNombre: opts.formNombre,
      formEmail: opts.formEmail,
      ofertaTexto: opts.ofertaTexto,
    });

    const updatePayload: Record<string, unknown> = {
      parse_status: result.status,
      parsed_at: new Date().toISOString(),
      keywords: result.keywords,
      palabras_clave: result.keywords,
      cv_parsed: result.cv_parsed,
      match_score: result.match_score,
    };

    if (!opts.formNombre && result.cv_parsed?.nombre_completo) {
      updatePayload.nombre = result.cv_parsed.nombre_completo;
    }
    if (!opts.formEmail && result.cv_parsed?.email) {
      updatePayload.email = result.cv_parsed.email;
    }

    const { error: updErr } = await serviceClient
      .from('postulaciones')
      .update(updatePayload)
      .eq('id', opts.postulationId);

    if (updErr) {
      console.error('[postulaciones] Error actualizando parse:', updErr);
    } else {
      console.info(
        `[postulaciones] parse ${result.status} id=${opts.postulationId} keywords=${result.keywords.length} score=${result.match_score}`,
      );
    }

    // Reintento edge solo si falló
    const edgeUrl = import.meta.env.SUPABASE_EDGE_PARSE_CV_URL;
    const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    if (edgeUrl && serviceKey && result.status === 'failed') {
      await fetch(edgeUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postulation_id: opts.postulationId }),
      }).catch((err) => console.warn('[postulaciones] edge reparse skip:', err));
    }
  } catch (e) {
    console.error('[postulaciones] parse no crítico falló:', e);
    await serviceClient
      .from('postulaciones')
      .update({
        parse_status: 'failed',
        parsed_at: new Date().toISOString(),
      })
      .eq('id', opts.postulationId);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return json(
      { error: 'Demasiadas postulaciones. Espera una hora antes de intentarlo de nuevo.' },
      429,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Datos inválidos.' }, 400);
  }

  const rawEmail = form.get('email');
  const parsed = PostulacionSchema.safeParse({
    oferta_id: form.get('oferta_id'),
    nombre: form.get('nombre') || null,
    email: rawEmail === '' || rawEmail == null ? null : rawEmail,
  });

  if (!parsed.success) {
    return json({ error: parsed.error.errors[0]?.message || 'Datos inválidos.' }, 400);
  }

  const cv = form.get('cv') as File | null;
  if (!cv || cv.size === 0) {
    return json({ error: 'Debes adjuntar tu CV.' }, 400);
  }
  if (cv.size > MAX_CV_SIZE) {
    return json({ error: 'El CV supera el tamaño máximo de 5MB.' }, 400);
  }

  const cvBuffer = await cv.arrayBuffer();
  const fileCheck = validateCvFile(cvBuffer, cv.type, cv.name, cv.size);
  if (!fileCheck.ok) {
    return json({ error: fileCheck.error || 'Archivo de CV inválido.' }, 400);
  }

  const serviceClient = createServiceClient();

  const { data: oferta } = await serviceClient
    .from('ofertas')
    .select('id, titulo, descripcion, categoria, tipo_empleo, comuna')
    .eq('id', parsed.data.oferta_id)
    .eq('activa', true)
    .gte('expira_en', new Date().toISOString())
    .single();

  if (!oferta) {
    return json({ error: 'La oferta no está disponible.' }, 404);
  }

  const ext = storageExtension(fileCheck.format, cv.name);
  const fileName = `${parsed.data.oferta_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data: uploadData, error: uploadError } = await serviceClient.storage
    .from('cvs')
    .upload(fileName, cvBuffer, {
      contentType: fileCheck.mimeType,
      upsert: false,
    });

  if (uploadError || !uploadData) {
    console.error('[postulaciones] Error subiendo CV:', uploadError);
    return json({ error: 'Error al subir el CV. Intenta de nuevo.' }, 500);
  }

  const nombre = parsed.data.nombre || null;
  const email =
    typeof parsed.data.email === 'string' && parsed.data.email.length > 0
      ? parsed.data.email
      : null;

  // Insertar postulación — parse_status pending; respuesta inmediata al candidato
  const { data: inserted, error: dbError } = await serviceClient
    .from('postulaciones')
    .insert({
      oferta_id: parsed.data.oferta_id,
      nombre,
      email,
      cv_url: uploadData.path,
      ip_address: ip,
      parse_status: 'pending',
      palabras_clave: [],
      keywords: [],
    })
    .select('id')
    .single();

  if (dbError || !inserted) {
    await serviceClient.storage.from('cvs').remove([fileName]);
    console.error('[postulaciones] Error guardando postulación:', dbError);
    return json({ error: 'Error al guardar la postulación. Intenta de nuevo.' }, 500);
  }

  const ofertaTexto = [
    oferta.titulo,
    oferta.descripcion,
    oferta.categoria,
    oferta.tipo_empleo,
    oferta.comuna,
  ]
    .filter(Boolean)
    .join('\n');

  // ── Parse en background (no bloquea al candidato) ──
  scheduleBackground(
    runParseInBackground({
      postulationId: inserted.id,
      buffer: cvBuffer,
      mimeType: fileCheck.mimeType,
      fileName: cv.name,
      format: fileCheck.format,
      formNombre: nombre,
      formEmail: email,
      ofertaTexto,
    }),
  );

  return json({ ok: true, id: inserted.id, parsing: true }, 200);
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
