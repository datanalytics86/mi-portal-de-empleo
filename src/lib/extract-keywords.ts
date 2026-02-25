// Stopwords: preposiciones, artículos, conectores y ruido genérico de CVs en español
const STOPWORDS = new Set([
  // Artículos y determinantes
  'a', 'al', 'el', 'la', 'los', 'las', 'un', 'una', 'unas', 'uno',
  // Preposiciones
  'ante', 'bajo', 'con', 'contra', 'de', 'del', 'desde', 'durante',
  'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'según',
  'sin', 'sobre', 'tras',
  // Conjunciones y conectores
  'además', 'así', 'aunque', 'como', 'cual', 'cuando', 'donde', 'durante',
  'e', 'es', 'esto', 'más', 'mas', 'muy', 'ni', 'o', 'pero', 'que',
  'sino', 'también', 'tan', 'tanto', 'todavía', 'ya', 'y',
  // Pronombres
  'él', 'ella', 'ellas', 'ellos', 'ello', 'ese', 'esa', 'eso', 'esos',
  'esas', 'este', 'esta', 'esto', 'estos', 'estas', 'me', 'mi', 'mis',
  'mí', 'nos', 'se', 'si', 'sí', 'su', 'sus', 'te', 'ti', 'tu', 'tus',
  'usted', 'ustedes', 'yo',
  // Verbos auxiliares y frecuentes en CVs
  'fue', 'era', 'han', 'has', 'hay', 'he', 'hemos', 'ser', 'sido',
  'son', 'soy', 'está', 'estan', 'estar', 'estoy', 'tiene', 'tener',
  'tengo', 'tienen',
  // Ruido genérico en CVs
  'área', 'areas', 'cargo', 'cada', 'cargos', 'empresa', 'empresas',
  'equipo', 'equipos', 'entre', 'función', 'funciones', 'labor', 'labores',
  'nivel', 'otro', 'otra', 'otros', 'otras', 'parte', 'personal',
  'proyecto', 'proyectos', 'puesto', 'realizar', 'sistema', 'sistemas',
  'todo', 'toda', 'todos', 'todas', 'tipo', 'trabajo', 'través', 'vez',
  'como', 'modo',
]);

/**
 * Extrae las palabras más frecuentes de un texto, eliminando stopwords y ruido.
 * Devuelve hasta `max` términos ordenados por frecuencia descendente.
 */
export function extractKeywords(text: string, max = 20): string[] {
  const freq = new Map<string, number>();

  const tokens = text
    .split(/[\s\n\r\t,.:;()\[\]{}\/\\|<>"'!?@#$%^&*+=\-–—_·•]+/)
    .filter(w => {
      if (w.length < 4 || w.length > 40) return false;          // muy corta o muy larga
      if (/^\d+$/.test(w)) return false;                         // solo números
      if (w.includes('@') || w.startsWith('http')) return false; // emails/URLs
      const norm = w.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
      return !STOPWORDS.has(norm) && !STOPWORDS.has(w.toLowerCase());
    });

  for (const token of tokens) {
    const key = token.toLowerCase();
    freq.set(key, (freq.get(key) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}
