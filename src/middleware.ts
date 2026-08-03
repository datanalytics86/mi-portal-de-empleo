import { defineMiddleware } from 'astro:middleware';
import { getEmpleadorSession } from './lib/auth';
import { applySecurityHeaders, generateCspNonce } from './lib/security-headers';

// Páginas del empleador que requieren sesión activa
const PROTECTED_PAGES = ['/empleador/dashboard', '/empleador/oferta/'];

// API routes que requieren sesión (responden 401 en lugar de redirigir)
const PROTECTED_API = ['/api/ofertas/', '/api/postulaciones/cv'];

export const onRequest = defineMiddleware(async (context, next) => {
  // Nonce por request: disponible en Layout y en el header CSP
  const cspNonce = generateCspNonce();
  context.locals.cspNonce = cspNonce;

  const { pathname } = context.url;
  const isPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p));
  const isApi = PROTECTED_API.some((p) => pathname.startsWith(p));

  if (isPage || isApi) {
    const session = await getEmpleadorSession(context.cookies);
    if (!session) {
      if (isApi) {
        return applySecurityHeaders(
          new Response(JSON.stringify({ error: 'No autorizado.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }),
          { nonce: cspNonce },
        );
      }
      return applySecurityHeaders(context.redirect('/empleador/login'), { nonce: cspNonce });
    }
    context.locals.session = session;
  }

  const response = await next();
  return applySecurityHeaders(response, { nonce: cspNonce });
});
