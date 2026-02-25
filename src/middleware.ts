import { defineMiddleware } from 'astro:middleware';
import { getEmpleadorSession } from './lib/auth';

// Páginas del empleador que requieren sesión activa
const PROTECTED_PAGES = ['/empleador/dashboard', '/empleador/oferta/'];

// API routes que requieren sesión (responden 401 en lugar de redirigir)
const PROTECTED_API = ['/api/ofertas/', '/api/postulaciones/cv'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isPage = PROTECTED_PAGES.some(p => pathname.startsWith(p));
  const isApi  = PROTECTED_API.some(p => pathname.startsWith(p));

  if (isPage || isApi) {
    const session = await getEmpleadorSession(context.cookies);
    if (!session) {
      if (isApi) {
        return new Response(JSON.stringify({ error: 'No autorizado.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return context.redirect('/empleador/login');
    }
    context.locals.session = session;
  }

  return next();
});
