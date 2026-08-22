import type { APIRoute } from 'astro';
import { createServiceClient } from '../../../lib/supabase';
import { getSql } from '../../../lib/neon';

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = import.meta.env.CRON_SECRET;

  // Vercel envía este header para autenticar cron jobs
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('No autorizado', { status: 401 });
  }

  const hace90dias = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  let archivos: string[] = [];
  let archivosPerfil: string[] = [];

  try {
    const client = createServiceClient();
    const { data: viejas } = await client
      .from('postulaciones')
      .select('id, cv_url')
      .lt('created_at', hace90dias);

    archivos = (viejas ?? []).map((p) => p.cv_url).filter(Boolean);
    if (archivos.length > 0) {
      await client.storage.from('cvs').remove(archivos);
      await client.from('postulaciones').delete().lt('created_at', hace90dias);
    }

    const { data: perfilesViejos } = await client
      .from('perfiles')
      .select('id, cv_url')
      .lt('created_at', hace90dias);

    archivosPerfil = (perfilesViejos ?? []).map((p) => p.cv_url).filter(Boolean);
    if (archivosPerfil.length > 0) {
      await client.storage.from('cvs').remove(archivosPerfil);
      await client.from('perfiles').delete().lt('created_at', hace90dias);
    }
  } catch {
    /* supabase ausente: seguimos con Neon */
  }

  let neonPostulaciones = 0;
  let neonPerfiles = 0;
  const neon = getSql();
  if (neon) {
    const delP = await neon`DELETE FROM public.postulaciones WHERE created_at < ${hace90dias}::timestamptz`;
    const delF = await neon`DELETE FROM public.perfiles WHERE created_at < ${hace90dias}::timestamptz`;
    neonPostulaciones = delP.count ?? 0;
    neonPerfiles = delF.count ?? 0;
  }

  return new Response(
    JSON.stringify({
      eliminadas: archivos.length,
      archivos: archivos.length,
      perfiles: archivosPerfil.length,
      neon_postulaciones: neonPostulaciones,
      neon_perfiles: neonPerfiles,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
