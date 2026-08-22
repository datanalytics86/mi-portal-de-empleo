import type { APIRoute } from 'astro';
import { resolvePublicOrigin } from '../lib/site-url';

export const GET: APIRoute = ({ url, request }) => {
  const base = resolvePublicOrigin({ requestUrl: url, request });

  const content = `User-agent: *
Allow: /

# Bloquear rutas privadas del empleador
Disallow: /empleador/dashboard
Disallow: /empleador/oferta/
Disallow: /api/

Sitemap: ${base}/sitemap.xml`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
