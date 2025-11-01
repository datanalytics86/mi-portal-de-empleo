import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString() || 'https://portalempleoschile.cl';

  const robotsTxt = `# Portal de Empleos Chile - robots.txt

User-agent: *
Allow: /
Disallow: /empleador/dashboard
Disallow: /api/

# Sitemap
Sitemap: ${siteUrl}sitemap.xml

# Crawl delay (seconds)
Crawl-delay: 1
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};
