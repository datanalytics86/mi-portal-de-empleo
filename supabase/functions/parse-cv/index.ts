/**
 * Supabase Edge Function: parse-cv
 *
 * Reprocesa un CV ya subido (postulación existente).
 * Uso principal: reintentos cuando el parse en Vercel falló, o batch manual.
 *
 * Auth: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 * Body: { "postulation_id": "uuid" }
 *
 * Nota: la extracción pesada de PDF/DOCX vive en el API de Astro (Node).
 * Esta función descarga el archivo, intenta extracción ligera con unpdf (PDF)
 * y/o reenvía a lógica rule-based embebida + LLM xAI.
 *
 * Deploy:
 *   supabase functions deploy parse-cv --no-verify-jwt
 * Secrets:
 *   supabase secrets set XAI_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... (auto)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const auth = req.headers.get('Authorization') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { postulation_id } = await req.json();
    if (!postulation_id || typeof postulation_id !== 'string') {
      return json({ error: 'postulation_id requerido' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: post, error: postErr } = await supabase
      .from('postulaciones')
      .select('id, cv_url, nombre, email, oferta_id, parse_status')
      .eq('id', postulation_id)
      .single();

    if (postErr || !post) {
      return json({ error: 'Postulación no encontrada' }, 404);
    }

    const { data: oferta } = await supabase
      .from('ofertas')
      .select('titulo, descripcion, categoria, tipo_empleo, comuna')
      .eq('id', post.oferta_id)
      .single();

    // Descargar CV
    const { data: fileData, error: dlErr } = await supabase.storage
      .from('cvs')
      .download(post.cv_url);

    if (dlErr || !fileData) {
      await markFailed(supabase, postulation_id, 'No se pudo descargar el CV del storage');
      return json({ error: 'Download failed', detail: dlErr?.message }, 500);
    }

    const buf = new Uint8Array(await fileData.arrayBuffer());
    const format = detectFormat(buf, post.cv_url);
    let text = '';

    if (format === 'doc') {
      await supabase
        .from('postulaciones')
        .update({
          parse_status: 'skipped',
          parsed_at: new Date().toISOString(),
          cv_parsed: {
            nombre_completo: post.nombre,
            email: post.email,
            warnings: ['.doc legacy no soportado en edge'],
            parse_method: 'rule',
            keywords: [],
            skills_tecnicas: [],
            skills_blandas: [],
            experiencia: [],
            educacion: [],
            idiomas: [],
            raw_text_length: 0,
          },
        })
        .eq('id', postulation_id);
      return json({ ok: true, status: 'skipped' });
    }

    if (format === 'pdf') {
      text = await extractPdfText(buf);
    } else if (format === 'docx') {
      text = await extractDocxText(buf);
    }

    text = cleanText(text);

    if (!text || text.replace(/\s/g, '').length < 40) {
      await markFailed(supabase, postulation_id, 'Sin texto extraíble (¿PDF escaneado?)');
      return json({ ok: true, status: 'failed', reason: 'no_text' });
    }

    // Rule-based ligero en edge
    let structured = ruleParse(text, post.nombre, post.email);

    // LLM opcional
    const xaiKey = Deno.env.get('XAI_API_KEY');
    if (xaiKey) {
      const llm = await llmParse(text, xaiKey, post.nombre, post.email);
      if (llm) {
        structured = { ...structured, ...llm, parse_method: 'hybrid' };
      }
    }

    const keywords: string[] = Array.from(
      new Set([
        ...(structured.keywords || []),
        ...(structured.skills_tecnicas || []),
        ...(structured.skills_blandas || []),
      ]),
    ).slice(0, 30);

    structured.keywords = keywords;
    structured.raw_text_length = text.length;

    const ofertaTexto = oferta
      ? [oferta.titulo, oferta.descripcion, oferta.categoria, oferta.comuna].join('\n')
      : '';
    const match_score = simpleMatch(keywords, ofertaTexto);

    const update: Record<string, unknown> = {
      parse_status: 'success',
      parsed_at: new Date().toISOString(),
      cv_parsed: structured,
      keywords,
      palabras_clave: keywords,
      match_score,
    };
    if (!post.nombre && structured.nombre_completo) update.nombre = structured.nombre_completo;
    if (!post.email && structured.email) update.email = structured.email;

    const { error: updErr } = await supabase
      .from('postulaciones')
      .update(update)
      .eq('id', postulation_id);

    if (updErr) {
      console.error('update error', updErr);
      return json({ error: updErr.message }, 500);
    }

    return json({ ok: true, status: 'success', keywords: keywords.length, match_score });
  } catch (e) {
    console.error('parse-cv fatal', e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  id: string,
  reason: string,
) {
  await supabase
    .from('postulaciones')
    .update({
      parse_status: 'failed',
      parsed_at: new Date().toISOString(),
      cv_parsed: {
        warnings: [reason],
        parse_method: 'rule',
        keywords: [],
        skills_tecnicas: [],
        skills_blandas: [],
        experiencia: [],
        educacion: [],
        idiomas: [],
        raw_text_length: 0,
        nombre_completo: null,
        email: null,
        telefono: null,
        titulo_profesional: null,
        resumen: null,
        anos_experiencia: null,
        ubicacion: null,
      },
    })
    .eq('id', id);
}

function detectFormat(buf: Uint8Array, path: string): 'pdf' | 'docx' | 'doc' | 'unknown' {
  if (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return 'pdf';
  }
  if (buf.length >= 4 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) {
    return 'doc';
  }
  if (buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4b) return 'docx';
  const lower = path.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.doc')) return 'doc';
  return 'unknown';
}

/** Extracción PDF: busca streams de texto simples (fallback sin pdf.js) */
async function extractPdfText(buf: Uint8Array): Promise<string> {
  try {
    // unpdf (Deno-friendly)
    const { extractText } = await import('https://esm.sh/unpdf@0.12.1');
    const { text } = await extractText(buf, { mergePages: true });
    return Array.isArray(text) ? text.join('\n') : String(text || '');
  } catch (e) {
    console.warn('unpdf failed, raw fallback', e);
    // Fallback muy básico: strings imprimibles
    const dec = new TextDecoder('latin1');
    const raw = dec.decode(buf);
    const matches = raw.match(/\((?:\\.|[^\\)]){3,}\)/g) || [];
    return matches
      .map((m) => m.slice(1, -1).replace(/\\n/g, '\n').replace(/\\(.)/g, '$1'))
      .join(' ');
  }
}

async function extractDocxText(buf: Uint8Array): Promise<string> {
  try {
    // JSZip + word/document.xml
    const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
    const zip = await JSZip.loadAsync(buf);
    const doc = await zip.file('word/document.xml')?.async('string');
    if (!doc) return '';
    return doc
      .replace(/<w:p[^>]*>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  } catch (e) {
    console.error('docx extract failed', e);
    return '';
  }
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r/g, '\n')
    .replace(/[•●]/g, '-')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ruleParse(text: string, formNombre: string | null, formEmail: string | null) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?56[\s\-.]?)?(?:9[\s\-.]?)?\d{4}[\s\-.]?\d{4}/);

  const skillsCatalog = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'SQL',
    'PostgreSQL', 'Excel', 'Power BI', 'AWS', 'Docker', 'Git', 'Scrum', 'Agile',
    'Salesforce', 'SAP', 'Marketing', 'SEO', 'Contabilidad', 'Liderazgo',
    'Trabajo en equipo', 'Comunicación', 'Negociación',
  ];
  const lower = text.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
  const skills_tecnicas: string[] = [];
  const skills_blandas: string[] = [];
  for (const s of skillsCatalog) {
    const n = s.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
    if (lower.includes(n)) {
      if (['Liderazgo', 'Trabajo en equipo', 'Comunicación', 'Negociación'].includes(s)) {
        skills_blandas.push(s);
      } else {
        skills_tecnicas.push(s);
      }
    }
  }

  const years = text.match(/(\d{1,2})\s*\+?\s*a[nñ]os?\s+(?:de\s+)?experiencia/i);

  return {
    nombre_completo: formNombre,
    email: formEmail || emailMatch?.[0] || null,
    telefono: phoneMatch?.[0] || null,
    titulo_profesional: null as string | null,
    resumen: text.slice(0, 400),
    experiencia: [] as unknown[],
    educacion: [] as unknown[],
    skills_tecnicas,
    skills_blandas,
    keywords: [...skills_tecnicas, ...skills_blandas],
    idiomas: [] as unknown[],
    anos_experiencia: years ? parseInt(years[1], 10) : null,
    ubicacion: null as string | null,
    parse_method: 'rule' as const,
    raw_text_length: text.length,
    warnings: [] as string[],
  };
}

async function llmParse(
  text: string,
  apiKey: string,
  formNombre: string | null,
  formEmail: string | null,
) {
  try {
    const model = Deno.env.get('XAI_MODEL') || 'grok-3-mini';
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Extrae datos de un CV chileno. Responde solo JSON con: nombre_completo, email, telefono, titulo_profesional, resumen, skills_tecnicas[], skills_blandas[], keywords[], idiomas[{idioma,nivel}], anos_experiencia, ubicacion, experiencia[{empresa,cargo,fecha_inicio,fecha_fin,descripcion}], educacion[{institucion,titulo,fecha,descripcion}]',
          },
          {
            role: 'user',
            content: text.slice(0, 10000),
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return {
      ...parsed,
      nombre_completo: formNombre || parsed.nombre_completo || null,
      email: formEmail || parsed.email || null,
      parse_method: 'llm',
    };
  } catch (e) {
    console.error('llm edge fail', e);
    return null;
  }
}

function simpleMatch(keywords: string[], oferta: string): number | null {
  if (!oferta || keywords.length === 0) return null;
  const o = oferta.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
  let hits = 0;
  for (const k of keywords) {
    const n = k.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
    if (n.length >= 3 && o.includes(n)) hits++;
  }
  return Math.min(100, Math.round((hits / keywords.length) * 100));
}
