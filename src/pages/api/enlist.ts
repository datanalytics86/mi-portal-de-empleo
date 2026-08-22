import type { APIRoute } from 'astro';
import {
  insertPerfil,
  storeCvFile,
  updatePerfil,
  ensureDemoCatalogSeeded,
} from '../../lib/persist';
import { recommendOfertas } from '../../lib/recommend';
import {
  validateCvFile,
  storageExtension,
  MAX_CV_SIZE,
  type CvFormat,
} from '../../lib/cv-parser/file-validation';
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
} from '../../lib/rate-limit';
import { log, captureException } from '../../lib/observability';
import { z } from 'zod';

/**
 * Enlistado sin oferta: CV → storage → perfiles → parse en background.
 * No toca /api/postulaciones. Comparte el rate limit de postulaciones (3/h).
 */

const EnlistSchema = z.object({
  nombre: z.string().max(100).optional().nullable(),
  email: z
    .union([z.string().email().max(200), z.literal(''), z.null()])
    .optional(),
});

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function scheduleBackground(task: Promise<unknown>): void {
  void task.catch((err) => {
    log.error('enlist.background_task_error', {
      error: err instanceof Error ? err.message : String(err),
    });
    void captureException(err, { tags: { component: 'enlist', phase: 'background' } });
  });

  try {
    import('@vercel/functions')
      .then((mod) => {
        if (typeof mod.waitUntil === 'function') {
          mod.waitUntil(task);
        }
      })
      .catch(() => {
        /* local */
      });
  } catch {
    /* ignore */
  }
}

async function runParseInBackground(opts: {
  profileId: string;
  buffer: ArrayBuffer;
  mimeType: string;
  fileName: string;
  format: CvFormat;
  formNombre: string | null;
  formEmail: string | null;
}): Promise<void> {
  try {
    const { parseCv } = await import('../../lib/cv-parser');
    const result = await parseCv({
      buffer: opts.buffer,
      mimeType: opts.mimeType,
      fileName: opts.fileName,
      format: opts.format,
      formNombre: opts.formNombre,
      formEmail: opts.formEmail,
      ofertaTexto: '',
    });

    const updatePayload: Record<string, unknown> = {
      parse_status: result.status,
      parsed_at: new Date().toISOString(),
      keywords: result.keywords,
      cv_parsed: result.cv_parsed,
    };

    if (!opts.formNombre && result.cv_parsed?.nombre_completo) {
      updatePayload.nombre = result.cv_parsed.nombre_completo;
    }
    if (!opts.formEmail && result.cv_parsed?.email) {
      updatePayload.email = result.cv_parsed.email;
    }

    try {
      await updatePerfil(opts.profileId, updatePayload);
      log.info('enlist.parse_persisted', {
        profile_id: opts.profileId,
        status: result.status,
        keywords: result.keywords.length,
      });
    } catch (updErr) {
      log.error('enlist.parse_update_failed', {
        profile_id: opts.profileId,
        error: updErr instanceof Error ? updErr.message : String(updErr),
      });
    }
  } catch (err) {
    log.error('enlist.parse_background_failed', {
      profile_id: opts.profileId,
      error: err instanceof Error ? err.message : String(err),
    });
    void captureException(err, { tags: { component: 'enlist', phase: 'parse_background' } });
    await updatePerfil(opts.profileId, {
      parse_status: 'failed',
      parsed_at: new Date().toISOString(),
    });
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    return await handleEnlist(request);
  } catch (err) {
    log.error('enlist.unhandled', {
      error: err instanceof Error ? err.message : String(err),
    });
    void captureException(err, { tags: { component: 'enlist', phase: 'unhandled' } });
    return json({ error: 'Error al guardar tu CV. Intenta de nuevo.' }, 500);
  }
};

async function handleEnlist(request: Request): Promise<Response> {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(ip, 'postulaciones');
  if (!rl.success) {
    return json(
      { error: 'Demasiados intentos. Espera una hora e inténtalo de nuevo.' },
      429,
      rateLimitHeaders(rl),
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Datos inválidos.' }, 400);
  }

  const rawEmail = form.get('email');
  const parsed = EnlistSchema.safeParse({
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

  const ext = storageExtension(fileCheck.format, cv.name);
  const fileName = `enlist/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  let cvUrl: string;
  try {
    cvUrl = await storeCvFile({
      path: fileName,
      buffer: cvBuffer,
      contentType: fileCheck.mimeType,
    });
  } catch (uploadError) {
    log.error('enlist.cv_upload_failed', {
      error: uploadError instanceof Error ? uploadError.message : String(uploadError),
    });
    void captureException(uploadError, {
      tags: { component: 'enlist', phase: 'upload' },
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
    inserted = await insertPerfil({
      nombre,
      email,
      cv_url: cvUrl,
      ip_address: ip,
    });
  } catch (dbError) {
    log.error('enlist.insert_failed', {
      error: dbError instanceof Error ? dbError.message : String(dbError),
    });
    void captureException(dbError, {
      tags: { component: 'enlist', phase: 'insert' },
    });
    return json({ error: 'Error al guardar tu CV. Intenta de nuevo.' }, 500);
  }

  scheduleBackground(
    runParseInBackground({
      profileId: inserted.id,
      buffer: cvBuffer,
      mimeType: fileCheck.mimeType,
      fileName: cv.name,
      format: fileCheck.format,
      formNombre: nombre,
      formEmail: email,
    }),
  );
  scheduleBackground(ensureDemoCatalogSeeded());

  let keywords: string[] = [];
  try {
    const { extractCvText } = await import('../../lib/cv-parser/extract-text');
    const { extractKeywords } = await import('../../lib/cv-parser/keywords');
    const extracted = await Promise.race([
      extractCvText(cvBuffer, fileCheck.format),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    if (extracted?.cleaned) {
      keywords = extractKeywords(extracted.cleaned, 20);
    }
  } catch {
    /* fail-open: matching con catálogo destacado */
  }

  if (keywords.length > 0) {
    await updatePerfil(inserted.id, { keywords }).catch(() => {
      /* el parse de fondo lo reintenta */
    });
  }

  const matches = recommendOfertas({ keywords, limit: 6 });

  return json(
    { ok: true, id: inserted.id, parsing: true, keywords, matches },
    200,
  );
}
