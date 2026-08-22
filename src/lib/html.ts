/**
 * Escapes and sanitizes values that are interpolated into HTML.
 * Astro escapes quotes in attributes but leaves `<`, which the CSP nonce
 * rewriter can then stamp if it scans the raw HTML with a regex.
 */

const ATTR_MAX = 200;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Query/search values painted into the document.
 * Strips NUL/control chars, truncates, and keeps the string safe for attributes.
 */
export function sanitizeSearchParam(raw: string | null | undefined, max = ATTR_MAX): string {
  if (raw == null) return '';
  return String(raw)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .slice(0, max);
}
