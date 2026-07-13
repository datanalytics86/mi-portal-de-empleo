/**
 * Orquestador de parsing de CVs (Tier 1).
 *
 * Pipeline:
 * 1. Validar archivo (MIME + magic bytes) — se hace en el caller
 * 2. Extraer texto (PDF/DOCX; PDF escaneado → OCR)
 * 3. Rule-based structured parse + keywords Chile
 * 4. Opcional: enriquecer con LLM (xAI Grok) si hay XAI_API_KEY
 * 5. Match score vs texto de oferta (opcional)
 *
 * Nunca lanza: siempre devuelve ParseCvResult con status.
 */

import type { CvFormat } from './file-validation';
import { extractCvText } from './extract-text';
import { parseWithRules } from './rule-parser';
import { parseWithLlm } from './llm-parser';
import { computeMatchScore } from './match-score';
import { extractKeywords } from './keywords';
import {
  emptyCvParsed,
  type CvParsed,
  type ParseCvInput,
  type ParseCvResult,
} from './types';

export type { CvParsed, ParseCvInput, ParseCvResult } from './types';
export type { CvFormat } from './file-validation';
export { CvParsedSchema, ParseStatusSchema, emptyCvParsed } from './types';
export { validateCvFile, MAX_CV_SIZE, ALLOWED_MIME, storageExtension } from './file-validation';
export { extractText, extractCvText, cleanCvText } from './extract-text';
export { extractKeywords } from './keywords';
export { computeMatchScore, matchScoreTone } from './match-score';
export { ocrPdf, isOcrEnabled } from './ocr';

export async function parseCv(
  input: ParseCvInput & { format: CvFormat },
): Promise<ParseCvResult> {
  const started = Date.now();
  const warnings: string[] = [];

  try {
    const extracted = await extractCvText(input.buffer, input.format);

    if (extracted.warning) warnings.push(extracted.warning);

    // .doc legacy o sin texto: postulación OK, parse skipped/failed
    if (input.format === 'doc') {
      return {
        status: 'skipped',
        cv_parsed: emptyCvParsed({
          nombre_completo: input.formNombre || null,
          email: input.formEmail || null,
          parse_method: 'rule',
          warnings,
        }),
        keywords: [],
        match_score: null,
        error: extracted.warning,
      };
    }

    if (!extracted.cleaned.trim() || extracted.cleaned.replace(/\s/g, '').length < 40) {
      return {
        status: 'failed',
        cv_parsed: emptyCvParsed({
          nombre_completo: input.formNombre || null,
          email: input.formEmail || null,
          parse_method: extracted.usedOcr ? 'ocr' : 'rule',
          used_ocr: extracted.usedOcr,
          ocr_engine: extracted.ocrEngine ?? null,
          warnings: warnings.length
            ? warnings
            : ['Sin texto extraíble (nativo ni OCR)'],
        }),
        keywords: [],
        match_score: null,
        error: extracted.warning || 'Sin texto extraíble del CV',
      };
    }

    // 1) Rules siempre (rápido, offline)
    let structured: CvParsed = parseWithRules(extracted.cleaned, {
      formNombre: input.formNombre,
      formEmail: input.formEmail,
    });
    structured.warnings = [...new Set([...structured.warnings, ...warnings])];
    structured.used_ocr = extracted.usedOcr;
    structured.ocr_engine = extracted.ocrEngine ?? null;
    if (extracted.usedOcr) {
      structured.parse_method = 'ocr';
    }

    // 2) LLM opcional (mejor precisión; también sobre texto OCR)
    const llm = await parseWithLlm(extracted.cleaned, {
      formNombre: input.formNombre,
      formEmail: input.formEmail,
    });

    if (llm) {
      structured = mergeParsed(structured, llm);
      structured.parse_method = 'hybrid';
      structured.used_ocr = extracted.usedOcr;
      structured.ocr_engine = extracted.ocrEngine ?? null;
    }

    // Keywords: unir catálogo + LLM
    const kw = uniqueStrings([
      ...structured.keywords,
      ...structured.skills_tecnicas,
      ...structured.skills_blandas,
      ...extractKeywords(extracted.cleaned, 20),
    ]).slice(0, 30);
    structured.keywords = kw;
    structured.raw_text_length = extracted.cleaned.length;

    const match_score = computeMatchScore(structured, input.ofertaTexto);

    console.info(
      `[parse-cv] ok method=${structured.parse_method} ocr=${extracted.usedOcr} keywords=${kw.length} ms=${Date.now() - started}`,
    );

    return {
      status: 'success',
      cv_parsed: structured,
      keywords: kw,
      match_score,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[parse-cv] fatal (non-blocking):', msg);
    return {
      status: 'failed',
      cv_parsed: emptyCvParsed({
        nombre_completo: input.formNombre || null,
        email: input.formEmail || null,
        parse_method: 'rule',
        warnings: [msg],
      }),
      keywords: [],
      match_score: null,
      error: msg,
    };
  }
}

/** Fusiona rule + LLM: LLM gana en campos no vacíos; arrays se unen */
function mergeParsed(rule: CvParsed, llm: CvParsed): CvParsed {
  const pick = <T>(a: T | null | undefined, b: T | null | undefined): T | null => {
    if (b != null && b !== '' && !(Array.isArray(b) && b.length === 0)) return b as T;
    if (a != null && a !== '' && !(Array.isArray(a) && a.length === 0)) return a as T;
    return (b ?? a ?? null) as T | null;
  };

  return emptyCvParsed({
    nombre_completo: pick(rule.nombre_completo, llm.nombre_completo),
    email: pick(rule.email, llm.email),
    telefono: pick(rule.telefono, llm.telefono),
    titulo_profesional: pick(rule.titulo_profesional, llm.titulo_profesional),
    resumen: pick(rule.resumen, llm.resumen),
    experiencia: llm.experiencia?.length ? llm.experiencia : rule.experiencia,
    educacion: llm.educacion?.length ? llm.educacion : rule.educacion,
    skills_tecnicas: uniqueStrings([
      ...rule.skills_tecnicas,
      ...llm.skills_tecnicas,
    ]),
    skills_blandas: uniqueStrings([
      ...rule.skills_blandas,
      ...llm.skills_blandas,
    ]),
    keywords: uniqueStrings([...rule.keywords, ...llm.keywords]),
    idiomas: llm.idiomas?.length ? llm.idiomas : rule.idiomas,
    anos_experiencia: pick(rule.anos_experiencia, llm.anos_experiencia),
    ubicacion: pick(rule.ubicacion, llm.ubicacion),
    parse_method: 'hybrid',
    used_ocr: rule.used_ocr || llm.used_ocr,
    ocr_engine: rule.ocr_engine || llm.ocr_engine,
    raw_text_length: Math.max(rule.raw_text_length, llm.raw_text_length),
    warnings: uniqueStrings([...rule.warnings, ...llm.warnings]),
  });
}

function uniqueStrings(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = s.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(s.trim());
  }
  return out;
}
