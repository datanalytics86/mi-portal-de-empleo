import { CvParsedSchema, emptyCvParsed, type CvParsed } from './types';

const XAI_BASE = 'https://api.x.ai/v1';
const DEFAULT_MODEL = 'grok-3-mini';
const TIMEOUT_MS = 18_000;
const MAX_TEXT_CHARS = 12_000;

/**
 * Extracción estructurada vía xAI (Grok) — OpenAI-compatible.
 * Si no hay API key o falla, retorna null (el caller usa rule-based).
 */
export async function parseWithLlm(
  cleanedText: string,
  opts: {
    formNombre?: string | null;
    formEmail?: string | null;
    apiKey?: string;
    model?: string;
  } = {},
): Promise<CvParsed | null> {
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.XAI_API_KEY) ||
    (typeof process !== 'undefined' ? process.env?.XAI_API_KEY : undefined) ||
    '';
  const apiKey = opts.apiKey || envKey;

  if (!apiKey || !cleanedText.trim()) return null;

  const envModel =
    (typeof import.meta !== 'undefined' && import.meta.env?.XAI_MODEL) ||
    (typeof process !== 'undefined' ? process.env?.XAI_MODEL : undefined) ||
    '';
  const model = opts.model || envModel || DEFAULT_MODEL;

  const text = cleanedText.slice(0, MAX_TEXT_CHARS);

  const system = `Eres un extractor de datos de CVs para el mercado laboral de Chile.
Devuelve ÚNICAMENTE un JSON válido (sin markdown) con esta forma exacta:
{
  "nombre_completo": string|null,
  "email": string|null,
  "telefono": string|null,
  "titulo_profesional": string|null,
  "resumen": string|null,
  "experiencia": [{"empresa":string|null,"cargo":string|null,"fecha_inicio":string|null,"fecha_fin":string|null,"descripcion":string|null}],
  "educacion": [{"institucion":string|null,"titulo":string|null,"fecha":string|null,"descripcion":string|null}],
  "skills_tecnicas": string[],
  "skills_blandas": string[],
  "keywords": string[],
  "idiomas": [{"idioma":string,"nivel":string|null}],
  "anos_experiencia": number|null,
  "ubicacion": string|null
}
Reglas:
- Español de Chile (conserva acentos y ñ).
- keywords: 10-25 términos útiles para matching laboral.
- skills_tecnicas: herramientas, lenguajes, software, metodologías.
- skills_blandas: soft skills.
- anos_experiencia: entero aproximado o null.
- ubicacion: comuna/ciudad si aparece.
- No inventes datos que no estén en el texto.
- Máximo 8 experiencias y 6 educaciones.`;

  const user = [
    opts.formNombre ? `Nombre del formulario: ${opts.formNombre}` : '',
    opts.formEmail ? `Email del formulario: ${opts.formEmail}` : '',
    '--- CV ---',
    text,
  ]
    .filter(Boolean)
    .join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${XAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[llm-parser] xAI error', res.status, body.slice(0, 300));
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const json = JSON.parse(stripMarkdownFence(content));
    const parsed = CvParsedSchema.safeParse({
      ...json,
      parse_method: 'llm',
      raw_text_length: cleanedText.length,
      warnings: [],
    });

    if (!parsed.success) {
      console.error('[llm-parser] Zod fail', parsed.error.flatten());
      // Intento de merge parcial
      return emptyCvParsed({
        ...json,
        parse_method: 'llm',
        raw_text_length: cleanedText.length,
        warnings: ['Respuesta LLM parcialmente inválida'],
      });
    }

    // Preferir datos del formulario si existen
    return {
      ...parsed.data,
      nombre_completo: opts.formNombre || parsed.data.nombre_completo,
      email: opts.formEmail || parsed.data.email,
      parse_method: 'llm',
    };
  } catch (e) {
    console.error('[llm-parser] exception', e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function stripMarkdownFence(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return m?.[1]?.trim() || t;
}
