import type { APIRoute } from 'astro';
import { createServiceClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = import.meta.env.CRON_SECRET;

  // Vercel envía este header para autenticar cron jobs
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('No autorizado', { status: 401 });
  }

  const client = createServiceClient();
  const hace90dias = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Obtener postulaciones con CVs a eliminar
  const { data: viejas, error } = await client
    .from('postulaciones')
    .select('id, cv_url')
    .lt('created_at', hace90dias);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const archivos = (viejas ?? []).map((p) => p.cv_url).filter(Boolean);
  if (archivos.length > 0) {
    await client.storage.from('cvs').remove(archivos);
    await client.from('postulaciones').delete().lt('created_at', hace90dias);
  }

  const { data: perfilesViejos } = await client
    .from('perfiles')
    .select('id, cv_url')
    .lt('created_at', hace90dias);

  const archivosPerfil = (perfilesViejos ?? []).map((p) => p.cv_url).filter(Boolean);
  if (archivosPerfil.length > 0) {
    await client.storage.from('cvs').remove(archivosPerfil);
    await client.from('perfiles').delete().lt('created_at', hace90dias);
  }

  return new Response(
    JSON.stringify({
      eliminadas: archivos.length,
      archivos: archivos.length,
      perfiles: archivosPerfil.length,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
