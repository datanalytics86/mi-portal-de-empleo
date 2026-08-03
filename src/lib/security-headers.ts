/**
 * Security headers baseline para todas las respuestas HTML/API.
 *
 * CSP Fase 2 (pragmática con nonces):
 * - Generamos un nonce por request y lo aplicamos a scripts que controlamos (p.ej. Leaflet).
 * - Se mantiene 'unsafe-inline' en script-src porque Astro View Transitions y los
 *   `<script>` de páginas (.astro) emiten inline sin nonce.
 *   → Fase 2.1: externalizar scripts de página / hashes para retirar unsafe-inline.
 * - 'unsafe-inline' en style-src: Tailwind + estilos de Leaflet + style= en UI.
 * - NO usamos 'unsafe-eval' (no necesario).
 * - Cuando hay nonce, algunos browsers ignoran unsafe-inline en script-src (CSP2/3).
 *   Por eso el nonce se emite junto a unsafe-inline: en browsers modernos el nonce
 *   cubre scripts etiquetados; en la práctica Astro + VT siguen requiriendo
 *   unsafe-inline hasta la 2.1. Si se detectan roturas, priorizar UX (documentado).
 */

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()',
  'X-DNS-Prefetch-Control': 'on',
  // HSTS: Vercel ya lo aplica en el edge; reforzamos en respuesta app
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  // Endurecimiento adicional (bajo riesgo de rotura)
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

/**
 * Genera un nonce criptográfico apto para atributos CSP / HTML.
 * Base64 URL-safe sin padding excesivo.
 */
export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // btoa en Node/Edge: usar Buffer si está; si no, btoa sobre binary string
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Construye la Content-Security-Policy.
 * @param nonce — si se pasa, se incluye 'nonce-…' en script-src (scripts controlados).
 */
export function buildCsp(nonce?: string): string {
  const nonceSrc = nonce ? ` 'nonce-${nonce}'` : '';

  /**
   * script-src:
   * - 'self' — bundles Astro/Vite
   * - 'unsafe-inline' — REQUIRED hoy: View Transitions + scripts de página Astro
   *   (Fase 2.1: retirar cuando scripts estén externalizados o hasheados)
   * - nonce — scripts etiquetados por nosotros (Leaflet CDN tag)
   * - https://unpkg.com — Leaflet 1.9.4
   *
   * style-src:
   * - 'unsafe-inline' — REQUIRED: Tailwind runtime classes + Leaflet CSS + style attrs
   * - fonts.googleapis.com, unpkg (Leaflet CSS)
   *
   * NO incluimos 'unsafe-eval'.
   */
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${nonceSrc} https://unpkg.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.x.ai https://api.ocr.space https://*.upstash.io",
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

export interface ApplySecurityHeadersOptions {
  /** Nonce CSP de esta request (HTML). Omitir en JSON/redirects si se prefiere. */
  nonce?: string;
}

/** Aplica headers de seguridad sobre una Response (mutación in-place de headers). */
export function applySecurityHeaders(
  response: Response,
  options: ApplySecurityHeadersOptions = {},
): Response {
  const headers = response.headers;

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  if (!headers.has('Content-Security-Policy')) {
    headers.set('Content-Security-Policy', buildCsp(options.nonce));
  }

  return response;
}

export { SECURITY_HEADERS };
