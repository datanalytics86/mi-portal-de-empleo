import { normalizeForMatch } from './skills-chile';
import type { CvParsed } from './types';

/**
 * Score básico CV ↔ oferta (0–100).
 * Heurística: solapamiento de keywords/skills + señales de título/experiencia.
 * Pensado para v1; no es ML.
 */
export function computeMatchScore(
  cv: CvParsed,
  ofertaTexto: string | null | undefined,
): number | null {
  if (!ofertaTexto?.trim()) return null;

  const ofertaNorm = normalizeForMatch(ofertaTexto);
  if (ofertaNorm.length < 20) return null;

  const cvTerms = uniqueNormalized([
    ...cv.keywords,
    ...cv.skills_tecnicas,
    ...cv.skills_blandas,
    cv.titulo_profesional || '',
    ...(cv.experiencia.map((e) => e.cargo || '').filter(Boolean) as string[]),
  ]);

  if (cvTerms.length === 0) return 0;

  let hits = 0;
  let weightSum = 0;

  for (const term of cvTerms) {
    const w = termWeight(term);
    weightSum += w;
    if (ofertaNorm.includes(term)) hits += w;
  }

  // Bonus: años de experiencia mencionados en oferta
  let bonus = 0;
  const reqYears = ofertaTexto.match(/(\d+)\s*\+?\s*a[nñ]os?/i);
  if (reqYears && cv.anos_experiencia != null) {
    const need = parseInt(reqYears[1], 10);
    if (cv.anos_experiencia >= need) bonus += 8;
    else if (cv.anos_experiencia >= need - 1) bonus += 4;
  }

  // Bonus soft: alguna skill técnica en oferta
  const techHits = cv.skills_tecnicas.filter((s) =>
    ofertaNorm.includes(normalizeForMatch(s)),
  ).length;
  if (techHits >= 3) bonus += 10;
  else if (techHits >= 1) bonus += 5;

  const base = weightSum > 0 ? (hits / weightSum) * 100 : 0;
  const score = Math.round(Math.min(100, Math.max(0, base + bonus)));
  return score;
}

function uniqueNormalized(terms: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of terms) {
    const n = normalizeForMatch(t);
    if (n.length < 3 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function termWeight(term: string): number {
  // Términos técnicos/largos pesan más que genéricos
  if (term.length >= 10) return 2;
  if (term.length >= 6) return 1.5;
  return 1;
}

/** Color Tailwind-friendly para UI */
export function matchScoreTone(score: number | null): 'high' | 'mid' | 'low' | 'none' {
  if (score == null) return 'none';
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}
