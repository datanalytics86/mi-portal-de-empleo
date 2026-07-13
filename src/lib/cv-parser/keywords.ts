import {
  SKILLS_BLANDAS,
  SKILLS_TECNICAS,
  matchCatalogSkills,
  normalizeForMatch,
} from './skills-chile';

// Stopwords ES + ruido típico de CVs
const STOPWORDS = new Set(
  [
    'a', 'al', 'el', 'la', 'los', 'las', 'un', 'una', 'unas', 'uno',
    'ante', 'bajo', 'con', 'contra', 'de', 'del', 'desde', 'durante',
    'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'segun',
    'sin', 'sobre', 'tras',
    'ademas', 'asi', 'aunque', 'como', 'cual', 'cuando', 'donde',
    'e', 'es', 'esto', 'mas', 'muy', 'ni', 'o', 'pero', 'que',
    'sino', 'tambien', 'tan', 'tanto', 'todavia', 'ya', 'y',
    'el', 'ella', 'ellas', 'ellos', 'ello', 'ese', 'esa', 'eso', 'esos',
    'esas', 'este', 'esta', 'estos', 'estas', 'me', 'mi', 'mis',
    'nos', 'se', 'si', 'su', 'sus', 'te', 'ti', 'tu', 'tus',
    'usted', 'ustedes', 'yo',
    'fue', 'era', 'han', 'has', 'hay', 'he', 'hemos', 'ser', 'sido',
    'son', 'soy', 'esta', 'estan', 'estar', 'estoy', 'tiene', 'tener',
    'tengo', 'tienen',
    'area', 'areas', 'cargo', 'cada', 'cargos', 'empresa', 'empresas',
    'equipo', 'equipos', 'funcion', 'funciones', 'labor', 'labores',
    'nivel', 'otro', 'otra', 'otros', 'otras', 'parte', 'personal',
    'proyecto', 'proyectos', 'puesto', 'realizar', 'sistema', 'sistemas',
    'todo', 'toda', 'todos', 'todas', 'tipo', 'trabajo', 'traves', 'vez',
    'modo', 'años', 'anos', 'mes', 'meses', 'enero', 'febrero', 'marzo',
    'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre',
    'noviembre', 'diciembre', 'actualidad', 'presente', 'chile',
    'curriculum', 'vitae', 'cv', 'resumen', 'perfil', 'objetivo',
    'referencias', 'disponibilidad', 'inmediata',
  ].map((w) => normalizeForMatch(w)),
);

/**
 * Combina catálogo curado (Chile) + frecuencia de tokens.
 * Prioriza skills del catálogo y rellena con términos frecuentes del CV.
 */
export function extractKeywords(text: string, max = 25): string[] {
  if (!text.trim()) return [];

  const tecnicas = matchCatalogSkills(text, SKILLS_TECNICAS);
  const blandas = matchCatalogSkills(text, SKILLS_BLANDAS);
  const catalog = [...tecnicas, ...blandas];

  const freq = new Map<string, number>();
  const tokens = text
    .split(/[\s\n\r\t,.:;()\[\]{}\/\\|<>"'!?@#$%^&*+=\-–—_·•]+/u)
    .filter((w) => {
      if (w.length < 4 || w.length > 40) return false;
      if (/^\d+$/.test(w)) return false;
      if (w.includes('@') || w.startsWith('http')) return false;
      const norm = normalizeForMatch(w);
      return !STOPWORDS.has(norm);
    });

  for (const token of tokens) {
    // Mantener capitalización original si parece acrónimo / skill
    const key = token.length <= 4 && token === token.toUpperCase()
      ? token
      : token.toLowerCase();
    freq.set(key, (freq.get(key) || 0) + 1);
  }

  const frequent = [...freq.entries()]
    .filter(([, n]) => n >= 1)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  const seen = new Set<string>();
  const out: string[] = [];

  const push = (term: string) => {
    const n = normalizeForMatch(term);
    if (!n || seen.has(n)) return;
    seen.add(n);
    out.push(term);
  };

  for (const s of catalog) push(s);
  for (const w of frequent) {
    if (out.length >= max) break;
    push(w);
  }

  return out.slice(0, max);
}

/** Re-export para compatibilidad con import antiguo */
export { extractKeywords as default };
