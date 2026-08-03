import { defineMiddleware } from 'astro:middleware';
import { getEmpleadorSession } from './lib/auth';
import {
  applySecurityHeaders,
  applyCspToHtmlResponse,
  generateCspNonce,
} from './lib/security-headers';
import { log, captureException } from './lib/observability';

// Páginas del empleador que requieren sesión activa
const PROTECTED_PAGES = ['/empleador/dashboard', '/empleador/oferta/'];

// API routes que requieren sesión (responden 401 en lugar de redirigir)
const PROTECTED_API = ['/api/ofertas/', '/api/postulaciones/cv'];

export const onRequest = defineMiddleware(async (context, next) => {
  const cspNonce = generateCspNonce();
  context.locals.cspNonce = cspNonce;

  const { pathname } = context.url;
  const isPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p));
  const isApi = PROTECTED_API.some((p) => pathname.startsWith(p));

  try {
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
        return applySecurityHeaders(context.redirect('/empleador/login'), {
          nonce: cspNonce,
        });
      }
      context.locals.session = session;
    }

    const response = await next();

    // HTML: inyectar nonces en <script> + CSP strict
    // API/otros: solo headers
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('text/html')) {
      return applyCspToHtmlResponse(response, cspNonce);
    }
    return applySecurityHeaders(response, { nonce: cspNonce });
  } catch (err) {
    log.error('middleware.unhandled', {
      path: pathname,
      error: err instanceof Error ? err.message : String(err),
    });
    void captureException(err, {
      tags: { component: 'middleware' },
      extra: { path: pathname },
    });
    throw err;
  }
});
