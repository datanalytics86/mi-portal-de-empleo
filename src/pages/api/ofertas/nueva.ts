import type { APIRoute } from 'astro';
import { getEmpleadorSession } from '../../../lib/auth';
import { createServiceClient } from '../../../lib/supabase';
import { getComunaCoords } from '../../../lib/comunas';
import { z } from 'zod';

const OfertaSchema = z.object({
  titulo: z.string().min(5, 'El título es demasiado corto').max(120),
  descripcion: z.string().min(50, 'La descripción debe tener al menos 50 caracteres').max(2000),
  tipo_empleo: z.enum(['full-time', 'part-time', 'freelance', 'practica']),
  categoria: z.string().min(1, 'Selecciona una categoría').max(50),
  comuna: z.string().min(1, 'Selecciona una comuna').max(100),
  expira_en: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getEmpleadorSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const form = await request.formData();
  const parsed = OfertaSchema.safeParse({
    titulo: form.get('titulo'),
    descripcion: form.get('descripcion'),
    tipo_empleo: form.get('tipo_empleo'),
    categoria: form.get('categoria'),
    comuna: form.get('comuna'),
    expira_en: form.get('expira_en'),
  });

  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || 'Datos inválidos.';
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validar fecha de expiración
  const expiraDate = new Date(parsed.data.expira_en);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (expiraDate <= hoy) {
    return new Response(JSON.stringify({ error: 'La fecha de cierre debe ser futura.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Obtener coordenadas de la comuna
  const coords = getComunaCoords(parsed.data.comuna);
  if (!coords) {
    return new Response(JSON.stringify({ error: 'Comuna no reconocida.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const serviceClient = createServiceClient();
  const { error: dbError } = await serviceClient.from('ofertas').insert({
    titulo: parsed.data.titulo,
    descripcion: parsed.data.descripcion,
    empresa: session.empleador.empresa,
    tipo_empleo: parsed.data.tipo_empleo,
    categoria: parsed.data.categoria,
    comuna: parsed.data.comuna,
    lat: coords.lat,
    lng: coords.lng,
    expira_en: new Date(parsed.data.expira_en).toISOString(),
    empleador_id: session.empleador.id,
    activa: true,
  });

  if (dbError) {
    console.error('Error creando oferta:', dbError);
    return new Response(JSON.stringify({ error: 'Error al guardar la oferta. Intenta de nuevo.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
