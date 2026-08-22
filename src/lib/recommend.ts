/**
 * Matching CV → ofertas (v1, sin ML).
 * Overlap de keywords contra título + descripción + categoría,
 * con bonus por categoría y comuna.
 */
import { normalizeForMatch } from './cv-parser/skills-chile';
import { getDemoOfertas, type PublicOferta } from './demo-catalog';

export type RecommendedOferta = {
  id: string;
  titulo: string;
  empresa: string;
  comuna: string;
  categoria: string;
  match_score: number;
};

export type RecommendInput = {
  keywords?: string[] | null;
  categoria?: string | null;
  comuna?: string | null;
  limit?: number;
  ofertas?: PublicOferta[];
};

/** Términos que, si aparecen en el CV, empujan ofertas de esa categoría (catálogo demo no lista stacks). */
const CATEGORY_TERMS: Record<string, string[]> = {
  Tecnología: [
    'react', 'typescript', 'javascript', 'python', 'java', 'node', 'sql', 'frontend',
    'backend', 'fullstack', 'devops', 'software', 'desarrollador', 'programacion',
    'datos', 'data', 'cloud', 'aws', 'docker', 'git', 'qa',
  ],
  Ventas: ['ventas', 'comercial', 'retail', 'crm', 'negociacion', 'account'],
  Marketing: ['marketing', 'seo', 'sem', 'contenido', 'community', 'brand', 'ads'],
  Finanzas: ['contable', 'finanzas', 'ifrs', 'tesoreria', 'auditor', 'sii', 'iva'],
  Administración: ['administrativ', 'oficina', 'recepcion', 'asistente'],
  Salud: ['enfermer', 'clinico', 'salud', 'uci', 'farmacia', 'kinesiolog', 'matron'],
  Educación: ['profesor', 'educacion', 'docente', 'aula', 'pedagog'],
  Operaciones: ['logistica', 'bodega', 'inventario', 'operario', 'supply'],
  Diseño: ['diseno', 'ux', 'ui', 'figma', 'grafico', 'ilustr'],
  Legal: ['abogad', 'legal', 'derecho', 'compliance', 'laboral'],
};

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

function scoreOferta(
  oferta: PublicOferta,
  terms: string[],
  categoria?: string | null,
  comuna?: string | null,
): number {
  const haystack = normalizeForMatch(
    [oferta.titulo, oferta.descripcion, oferta.categoria, oferta.empresa, oferta.comuna].join(' '),
  );

  const catHints = (CATEGORY_TERMS[oferta.categoria] || []).map(normalizeForMatch);

  let hits = 0;
  let weight = 0;
  for (const term of terms) {
    const w = term.length >= 10 ? 2 : term.length >= 6 ? 1.5 : 1;
    weight += w;
    if (haystack.includes(term) || catHints.some((h) => term.includes(h) || h.includes(term))) {
      hits += w;
    }
  }

  let bonus = 0;
  if (categoria && oferta.categoria === categoria) bonus += 15;
  if (comuna && normalizeForMatch(oferta.comuna).includes(normalizeForMatch(comuna))) bonus += 10;
  if (terms.some((t) => normalizeForMatch(oferta.titulo).includes(t))) bonus += 8;

  const base = weight > 0 ? (hits / weight) * 100 : 0;
  return Math.round(Math.min(100, Math.max(0, base + bonus)));
}

/**
 * Devuelve 3–6 ofertas ordenadas por score.
 * Sin keywords: recorte diverso (una por categoría) con score bajo, no vacío.
 */
export function recommendOfertas(input: RecommendInput = {}): RecommendedOferta[] {
  const limit = Math.min(6, Math.max(3, input.limit ?? 6));
  const ofertas = (input.ofertas ?? getDemoOfertas()).filter(
    (o) => o.activa && o.expira_en >= new Date().toISOString(),
  );
  if (ofertas.length === 0) return [];

  const terms = uniqueNormalized(input.keywords ?? []);
  const scored = ofertas.map((o) => ({
    o,
    score: terms.length
      ? scoreOferta(o, terms, input.categoria, input.comuna)
      : 0,
  }));

  if (terms.length === 0) {
    const seen = new Set<string>();
    const diverse: PublicOferta[] = [];
    for (const o of ofertas) {
      if (seen.has(o.categoria)) continue;
      seen.add(o.categoria);
      diverse.push(o);
      if (diverse.length >= limit) break;
    }
    while (diverse.length < Math.min(limit, ofertas.length)) {
      const next = ofertas.find((o) => !diverse.includes(o));
      if (!next) break;
      diverse.push(next);
    }
    return diverse.slice(0, limit).map((o) => ({
      id: o.id,
      titulo: o.titulo,
      empresa: o.empresa,
      comuna: o.comuna,
      categoria: o.categoria,
      match_score: 0,
    }));
  }

  scored.sort((a, b) => b.score - a.score || (a.o.created_at < b.o.created_at ? 1 : -1));
  return scored.slice(0, limit).map(({ o, score }) => ({
    id: o.id,
    titulo: o.titulo,
    empresa: o.empresa,
    comuna: o.comuna,
    categoria: o.categoria,
    match_score: score,
  }));
}
