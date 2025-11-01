import type { APIRoute } from 'astro';
import { mockOfertas } from '../data/mock-ofertas';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString() || 'https://portalempleoschile.cl';

  // URLs estáticas del sitio
  const staticUrls = [
    {
      url: '',
      changefreq: 'daily',
      priority: '1.0',
      lastmod: new Date().toISOString()
    },
    {
      url: 'empleador/login',
      changefreq: 'monthly',
      priority: '0.5',
      lastmod: new Date().toISOString()
    },
    {
      url: 'empleador/registro',
      changefreq: 'monthly',
      priority: '0.5',
      lastmod: new Date().toISOString()
    },
    {
      url: 'privacidad',
      changefreq: 'monthly',
      priority: '0.3',
      lastmod: new Date().toISOString()
    }
  ];

  // URLs dinámicas de ofertas activas
  const ofertasActivas = mockOfertas.filter(o => o.activa);
  const ofertaUrls = ofertasActivas.map(oferta => ({
    url: `oferta/${oferta.id}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: oferta.created_at
  }));

  // Combinar todas las URLs
  const allUrls = [...staticUrls, ...ofertaUrls];

  // Generar XML del sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(({ url, changefreq, priority, lastmod }) => `  <url>
    <loc>${siteUrl}${url}</loc>
    <lastmod>${lastmod.split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600' // Cache por 1 hora
    }
  });
};
