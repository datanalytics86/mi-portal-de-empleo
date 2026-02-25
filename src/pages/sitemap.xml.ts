import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const base = url.origin;

  const { data: ofertas } = await supabase
    .from('ofertas')
    .select('id, updated_at')
    .eq('activa', true)
    .gte('expira_en', new Date().toISOString());

  const staticUrls = [
    `<url><loc>${base}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${base}/empleador/login</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>`,
    `<url><loc>${base}/empleador/registro</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>`,
  ];

  const ofertaUrls = (ofertas || []).map(o => {
    const lastmod = o.updated_at ? o.updated_at.split('T')[0] : '';
    return `<url><loc>${base}/oferta/${o.id}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.8</priority></url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...ofertaUrls].join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
