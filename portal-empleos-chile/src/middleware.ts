import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = [
    '/empleador/dashboard',
    '/empleador/oferta/nueva',
  ];

  // Verificar si la ruta actual requiere autenticación
  const isProtectedRoute = protectedRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const authenticated = await isAuthenticated(cookies);

    if (!authenticated) {
      // Redirigir al login si no está autenticado
      return redirect('/empleador/login');
    }
  }

  // Continuar con la solicitud
  return next();
});
