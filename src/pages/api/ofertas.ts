import type { APIRoute } from 'astro';
import { FiltrosBusquedaSchema } from '@/lib/validations/schemas';
import { createServerClient } from '@/lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  try {
    // 1. Parsear parámetros de búsqueda
    const searchParams = {
      q: url.searchParams.get('q') || undefined,
      comuna: url.searchParams.get('comuna') || undefined,
      tipo_jornada: url.searchParams.get('tipo_jornada') || undefined,
      categoria: url.searchParams.get('categoria') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    // 2. Validar parámetros
    const validation = FiltrosBusquedaSchema.safeParse(searchParams);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Parámetros inválidos',
          details: validation.error.flatten(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const filters = validation.data;

    // 3. Construir query de Supabase
    const supabase = createServerClient();
    let query = supabase
      .from('ofertas')
      .select(
        `
        *,
        empleadores (
          nombre_empresa
        )
      `,
        { count: 'exact' }
      )
      .eq('activa', true)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    // 4. Aplicar filtros
    if (filters.q) {
      // Búsqueda full-text en título y empresa
      query = query.or(
        `titulo.ilike.%${filters.q}%,empresa.ilike.%${filters.q}%,descripcion.ilike.%${filters.q}%`
      );
    }

    if (filters.comuna) {
      query = query.eq('comuna', filters.comuna);
    }

    if (filters.tipo_jornada) {
      query = query.eq('tipo_jornada', filters.tipo_jornada);
    }

    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria);
    }

    // 5. Aplicar paginación
    query = query.range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

    // 6. Ejecutar query
    const { data: ofertas, error, count } = await query;

    if (error) {
      console.error('Error al obtener ofertas:', error);
      return new Response(
        JSON.stringify({ error: 'Error al obtener ofertas' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Transformar datos para incluir coordenadas
    // En producción, estas coordenadas vendrían directamente de PostGIS
    const ofertasConCoordenadas = ofertas?.map((oferta) => {
      // Extraer lat/lng del campo ubicacion (PostGIS GEOGRAPHY)
      // Formato: SRID=4326;POINT(lng lat)
      let lat = null;
      let lng = null;

      if (oferta.ubicacion) {
        const match = oferta.ubicacion.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        }
      }

      return {
        ...oferta,
        lat,
        lng,
      };
    });

    // 8. Calcular metadata de paginación
    const totalPages = Math.ceil((count || 0) / (filters.limit || 20));
    const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;

    // 9. Respuesta exitosa con metadata
    return new Response(
      JSON.stringify({
        ofertas: ofertasConCoordenadas,
        pagination: {
          total: count || 0,
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          currentPage,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error en /api/ofertas:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
