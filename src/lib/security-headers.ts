/**
 * Security headers + CSP Fase 2.1
 *
 * script-src (con nonce):
 *   'self' + 'nonce-…' + https://unpkg.com (Leaflet)
 *   SIN 'unsafe-inline' — los scripts de página reciben nonce vía injectScriptNonces()
 *   en el middleware (HTML rewrite).
 *
 * style-src:
 *   'unsafe-inline' se MANTIENE (Tailwind util classes en style attrs, Leaflet CSS, UI).
 *   Documentado; retirar requiere migrar a clases puras / CSS modules (Fase 2.2).
 *
 * Sin 'unsafe-eval'.
 */

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

/**
 * Genera un nonce criptográfico apto para atributos CSP / HTML.
 */
export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export type CspMode = 'strict' | 'legacy';

/**
 * Construye la Content-Security-Policy.
 *
 * @param nonce — nonce de la request
 * @param mode
 *   - `strict` (default con nonce): sin unsafe-inline en script-src
 *   - `legacy`: incluye unsafe-inline en script-src (solo si se pide explícitamente)
 */
export function buildCsp(nonce?: string, mode: CspMode = 'strict'): string {
  const nonceSrc = nonce ? ` 'nonce-${nonce}'` : '';
  // Sin nonce no podemos ser estrictos en scripts (SSR edge cases / errores)
  const allowInlineScripts = mode === 'legacy' || !nonce;
  const scriptInline = allowInlineScripts ? " 'unsafe-inline'" : '';

  /**
   * script-src:
   * - 'self' — bundles Astro/Vite
   * - nonce — scripts de página (inyectados) + Leaflet en Layout
   * - https://unpkg.com — Leaflet 1.9.4
   * - 'unsafe-inline' SOLO en mode legacy o sin nonce
   *
   * style-src:
   * - 'unsafe-inline' REQUIRED hoy (Tailwind style attrs, Leaflet, UI)
   *
   * script-src-attr:
   * - 'none' en modo strict — no onclick= inline (dashboard usa data-confirm)
   */
  const scriptSrc = `script-src 'self'${scriptInline}${nonceSrc} https://unpkg.com`;
  const scriptSrcAttr =
    allowInlineScripts ? "script-src-attr 'unsafe-inline'" : "script-src-attr 'none'";

  const directives = [
    "default-src 'self'",
    scriptSrc,
    scriptSrcAttr,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://*.basemaps.cartocdn.com https://basemaps.cartocdn.com https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.x.ai https://api.ocr.space https://*.upstash.io https://*.ingest.sentry.io https://*.sentry.io",
    "worker-src 'self' blob:",
    "media-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];
  return directives.join('; ');
}

/**
 * True when `index` sits inside an open tag's quoted attribute value
 * (`<input value="…<script>…">`). Those are user markup, not server scripts.
 */
export function isInsideHtmlAttribute(html: string, index: number): boolean {
  const lastLt = html.lastIndexOf('<', index - 1);
  if (lastLt < 0) return false;
  const between = html.slice(lastLt, index);
  if (between.includes('>')) return false;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < between.length; i++) {
    const ch = between[i]!;
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    }
  }
  return quote !== null;
}

/**
 * Inyecta `nonce="…"` solo en tags <script> reales del HTML del server.
 * No toca coincidencias dentro de atributos (query string, etc.).
 * No toca <script> que ya traen nonce.
 */
export function injectScriptNonces(html: string, nonce: string): string {
  if (!html || !nonce) return html;
  const safe = nonce.replace(/"/g, '');
  return html.replace(/<script(\s[^>]*)?>/gi, (full, attrs: string = '', offset: number) => {
    if (isInsideHtmlAttribute(html, offset)) return full;
    if (/\bnonce\s*=/i.test(attrs)) return full;
    const rest = attrs && attrs.trim().length ? attrs : '';
    return `<script nonce="${safe}"${rest}>`;
  });
}

export interface ApplySecurityHeadersOptions {
  nonce?: string;
  /** default: strict si hay nonce */
  mode?: CspMode;
}

/** Aplica headers de seguridad sobre una Response (mutación in-place de headers). */
export function applySecurityHeaders(
  response: Response,
  options: ApplySecurityHeadersOptions = {},
): Response {
  const headers = response.headers;
  const mode = options.mode ?? (options.nonce ? 'strict' : 'legacy');

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  if (!headers.has('Content-Security-Policy')) {
    headers.set('Content-Security-Policy', buildCsp(options.nonce, mode));
  }

  return response;
}

/**
 * Si la respuesta es HTML, reescribe el body inyectando nonces en <script>.
 * Devuelve una Response nueva (body consumido).
 */
export async function applyCspToHtmlResponse(
  response: Response,
  nonce: string,
): Promise<Response> {
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html') || !nonce) {
    return applySecurityHeaders(response, { nonce, mode: 'strict' });
  }

  try {
    const html = await response.text();
    const rewritten = injectScriptNonces(html, nonce);
    const headers = new Headers(response.headers);
    // Content-Length puede quedar obsoleto tras reescritura
    headers.delete('content-length');
    if (!headers.has('Content-Security-Policy')) {
      headers.set('Content-Security-Policy', buildCsp(nonce, 'strict'));
    }
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      if (!headers.has(key)) headers.set(key, value);
    }
    return new Response(rewritten, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    // Si falla la reescritura, aplicar headers sin tocar body
    return applySecurityHeaders(response, { nonce, mode: 'legacy' });
  }
}

export { SECURITY_HEADERS };
