/**
 * Security headers baseline para todas las respuestas HTML/API.
 * CSP pragmática: permite Leaflet (unpkg), Google Fonts, tiles OSM y Supabase.
 * No usa nonces (complejidad alta en Astro SSR + View Transitions); se revisará en Fase 2.
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
};

/**
 * CSP que no rompe el flujo actual (inline scripts de Astro, Leaflet CDN, tiles).
 * Ajustar cuando se externalicen scripts o se use nonce.
 */
function buildCsp(): string {
  const directives = [
    "default-src 'self'",
    // Astro View Transitions + scripts de página usan inline; Leaflet en unpkg
    "script-src 'self' 'unsafe-inline' https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.x.ai https://api.ocr.space https://*.upstash.io",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];
  return directives.join('; ');
}

/** Aplica headers de seguridad sobre una Response (mutación in-place de headers). */
export function applySecurityHeaders(response: Response): Response {
  const headers = response.headers;

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  if (!headers.has('Content-Security-Policy')) {
    headers.set('Content-Security-Policy', buildCsp());
  }

  return response;
}

export { SECURITY_HEADERS, buildCsp };
