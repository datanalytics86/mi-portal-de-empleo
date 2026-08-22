/**
 * Fold de búsqueda: minúsculas, sin acentos, stem ligero de género (a/o/as/os).
 * enfermera ≈ enfermero; Ñuñoa ≈ nunoa.
 */

export function foldSearch(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^\p{L}\p{N}+#.]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stemSearch(folded: string): string {
  if (folded.length < 5) return folded;
  return folded.replace(/(as|os|a|o)$/u, '');
}

export function searchNeedles(raw: string): string[] {
  const folded = foldSearch(raw);
  if (!folded) return [];
  const stem = stemSearch(folded);
  return stem && stem !== folded && stem.length >= 4 ? [folded, stem] : [folded];
}

export function likeSafe(s: string): string {
  return s.replace(/[\\%_]/g, '\\$&');
}

export function matchesFolded(haystack: string, needles: string[]): boolean {
  if (!needles.length) return true;
  const folded = foldSearch(haystack);
  return needles.some((n) => folded.includes(n));
}

/** SQL translate() pair: acentos → ASCII. */
export const SQL_ACCENT_FROM =
  'áàäâéèëêíìïîóòöôúùüûñÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑ';
export const SQL_ACCENT_TO =
  'aaaaeeeeiiiioooouuuunAAAAEEEEIIIIOOOOUUUUN';
