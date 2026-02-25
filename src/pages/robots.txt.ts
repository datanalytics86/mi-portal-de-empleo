import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ url }) => {
  const base = url.origin;

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
