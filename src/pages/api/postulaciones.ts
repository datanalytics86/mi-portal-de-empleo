import type { APIRoute } from 'astro';
import { insertPostulacion, storeCvFile, updatePostulacion } from '../../lib/persist';
import { loadPublicOferta } from '../../lib/public-ofertas';
import {
  parseCv,
  validateCvFile,
  storageExtension,
  MAX_CV_SIZE,
  type CvFormat,
} from '../../lib/cv-parser';
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
} from '../../lib/rate-limit';
import { log, captureException } from '../../lib/observability';
import { z } from 'zod';

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
  void task.catch((err) => {
    log.error('postulaciones.background_task_error', {
      error: err instanceof Error ? err.message : String(err),
    });
    void captureException(err, { tags: { component: 'postulaciones', phase: 'background' } });
  });

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

    try {
      await updatePostulacion(opts.postulationId, updatePayload);
      log.info('postulaciones.parse_persisted', {
        postulation_id: opts.postulationId,
        status: result.status,
        method: result.cv_parsed?.parse_method ?? null,
        keywords: result.keywords.length,
        match_score: result.match_score,
      });
    } catch (updErr) {
      log.error('postulaciones.parse_update_failed', {
        postulation_id: opts.postulationId,
        error: updErr instanceof Error ? updErr.message : String(updErr),
      });
      void captureException(updErr, {
        tags: { component: 'postulaciones', phase: 'parse_update' },
        extra: { postulation_id: opts.postulationId },
      });
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
      }).catch((err) =>
        log.warn('postulaciones.edge_reparse_skip', {
          postulation_id: opts.postulationId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  } catch (e) {
    // Fail-open: postulación ya guardada; solo marcamos parse failed
    log.error('postulaciones.parse_background_failed', {
      postulation_id: opts.postulationId,
      error: e instanceof Error ? e.message : String(e),
    });
    void captureException(e, {
      tags: { component: 'postulaciones', phase: 'parse_background' },
      extra: { postulation_id: opts.postulationId },
    });
    await updatePostulacion(opts.postulationId, {
      parse_status: 'failed',
      parsed_at: new Date().toISOString(),
    });
  }
}

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(ip, 'postulaciones');
  if (!rl.success) {
    return new Response(
      JSON.stringify({
        error: 'Demasiadas postulaciones. Espera una hora antes de intentarlo de nuevo.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitHeaders(rl),
        },
      },
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

  const oferta = await loadPublicOferta(parsed.data.oferta_id);
  if (!oferta || !oferta.activa || oferta.expira_en < new Date().toISOString()) {
    return json({ error: 'La oferta no está disponible.' }, 404);
  }

  const ext = storageExtension(fileCheck.format, cv.name);
  const fileName = `${parsed.data.oferta_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  let cvUrl: string;
  try {
    cvUrl = await storeCvFile({
      path: fileName,
      buffer: cvBuffer,
      contentType: fileCheck.mimeType,
    });
  } catch (uploadError) {
    log.error('postulaciones.cv_upload_failed', {
      error: uploadError instanceof Error ? uploadError.message : String(uploadError),
    });
    void captureException(uploadError, {
      tags: { component: 'postulaciones', phase: 'upload' },
    });
    return json({ error: 'Error al subir el CV. Intenta de nuevo.' }, 500);
  }

  const nombre = parsed.data.nombre || null;
  const email =
    typeof parsed.data.email === 'string' && parsed.data.email.length > 0
      ? parsed.data.email
      : null;

  let inserted: { id: string };
  try {
    inserted = await insertPostulacion({
      oferta_id: parsed.data.oferta_id,
      nombre,
      email,
      cv_url: cvUrl,
      ip_address: ip,
    });
  } catch (dbError) {
    log.error('postulaciones.insert_failed', {
      error: dbError instanceof Error ? dbError.message : String(dbError),
    });
    void captureException(dbError, {
      tags: { component: 'postulaciones', phase: 'insert' },
    });
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
