import { MAP_MARKERS_CAP, buildPageInfo, DEFAULT_PAGE_SIZE } from './pagination';
import { filterDemoOfertas, getDemoOferta, type PublicOferta } from './demo-catalog';
import { getSql, withSqlTimeout } from './neon';
import { log } from './observability';

export type PublicFilters = {
  q?: string;
  tipo?: string;
  comuna?: string;
  categoria?: string;
  page?: number;
  pageSize?: number;
  mapCap?: number;
};

export type PublicListResult = {
  ofertas: PublicOferta[];
  total: number;
  mapaOfertas: Array<Pick<PublicOferta, 'id' | 'titulo' | 'empresa' | 'lat' | 'lng' | 'comuna' | 'categoria'>>;
  pageInfo: ReturnType<typeof buildPageInfo>;
};

function mapRow(r: Record<string, unknown>): PublicOferta {
  return {
    id: String(r.id),
    titulo: String(r.titulo),
    descripcion: r.descripcion != null ? String(r.descripcion) : '',
    empresa: String(r.empresa),
    tipo_empleo: r.tipo_empleo as PublicOferta['tipo_empleo'],
    categoria: String(r.categoria ?? ''),
    comuna: String(r.comuna),
    lat: Number(r.lat),
    lng: Number(r.lng),
    activa: r.activa !== false,
    expira_en: new Date(String(r.expira_en)).toISOString(),
    empleador_id: String(r.empleador_id ?? ''),
    created_at: new Date(String(r.created_at)).toISOString(),
  };
}

function fromCatalog(filters: PublicFilters): PublicListResult {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const mapCap = filters.mapCap ?? MAP_MARKERS_CAP;
  const all = filterDemoOfertas(filters);
  const pageInfo = buildPageInfo(page, pageSize, all.length);
  const ofertas = all.slice(pageInfo.from, pageInfo.to + 1);
  return {
    ofertas,
    total: all.length,
    mapaOfertas: all.slice(0, mapCap).map((o) => ({
      id: o.id,
      titulo: o.titulo,
      empresa: o.empresa,
      lat: o.lat,
      lng: o.lng,
      comuna: o.comuna,
      categoria: o.categoria,
    })),
    pageInfo,
  };
}

export async function loadPublicOfertas(filters: PublicFilters): Promise<PublicListResult> {
  const sql = getSql();
  if (!sql) return fromCatalog(filters);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const mapCap = filters.mapCap ?? MAP_MARKERS_CAP;
  const q = (filters.q || '').trim();
  const tipo = filters.tipo || '';
  const comuna = (filters.comuna || '').trim();
  const categoria = filters.categoria || '';
  const qLike = q ? `%${q}%` : '';
  const comunaLike = comuna ? `%${comuna}%` : '';

  const queried = await withSqlTimeout(
    (async () => {
      const countRows = await sql<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM public.ofertas
        WHERE activa = TRUE
          AND expira_en >= NOW()
          AND (${q} = '' OR titulo ILIKE ${qLike} OR empresa ILIKE ${qLike})
          AND (${tipo} = '' OR tipo_empleo = ${tipo})
          AND (${comuna} = '' OR comuna ILIKE ${comunaLike})
          AND (${categoria} = '' OR categoria = ${categoria})
      `;
      const total = countRows[0]?.count ?? 0;
      const pageInfo = buildPageInfo(page, pageSize, total);
      const rows = await sql`
        SELECT id, titulo, descripcion, empresa, tipo_empleo, categoria, comuna,
               lat, lng, activa, expira_en, empleador_id, created_at
        FROM public.ofertas
        WHERE activa = TRUE
          AND expira_en >= NOW()
          AND (${q} = '' OR titulo ILIKE ${qLike} OR empresa ILIKE ${qLike})
          AND (${tipo} = '' OR tipo_empleo = ${tipo})
          AND (${comuna} = '' OR comuna ILIKE ${comunaLike})
          AND (${categoria} = '' OR categoria = ${categoria})
        ORDER BY created_at DESC
        OFFSET ${pageInfo.from}
        LIMIT ${pageSize}
      `;
      const mapRows = await sql`
        SELECT id, titulo, empresa, lat, lng, comuna, categoria
        FROM public.ofertas
        WHERE activa = TRUE
          AND expira_en >= NOW()
          AND (${q} = '' OR titulo ILIKE ${qLike} OR empresa ILIKE ${qLike})
          AND (${tipo} = '' OR tipo_empleo = ${tipo})
          AND (${comuna} = '' OR comuna ILIKE ${comunaLike})
          AND (${categoria} = '' OR categoria = ${categoria})
        ORDER BY created_at DESC
        LIMIT ${mapCap}
      `;
      return {
        ofertas: rows.map((r) => mapRow(r as Record<string, unknown>)),
        total,
        mapaOfertas: mapRows.map((o) => ({
          id: String(o.id),
          titulo: String(o.titulo),
          empresa: String(o.empresa),
          lat: Number(o.lat),
          lng: Number(o.lng),
          comuna: String(o.comuna),
          categoria: String(o.categoria ?? ''),
        })),
        pageInfo,
      } satisfies PublicListResult;
    })(),
  );

  if (queried && queried.total > 0) return queried;
  log.warn('public_ofertas.fallback_catalog', { reason: queried ? 'empty' : 'timeout_or_error' });
  return fromCatalog(filters);
}

export async function loadPublicOferta(id: string): Promise<PublicOferta | null> {
  if (!id) return null;
  const sql = getSql();
  if (sql) {
    const row = await withSqlTimeout(
      (async () => {
        const rows = await sql`
          SELECT id, titulo, descripcion, empresa, tipo_empleo, categoria, comuna,
                 lat, lng, activa, expira_en, empleador_id, created_at
          FROM public.ofertas
          WHERE id = ${id}::uuid
          LIMIT 1
        `;
        return rows[0] ? mapRow(rows[0] as Record<string, unknown>) : null;
      })(),
    );
    if (row) return row;
  }
  return getDemoOferta(id) ?? null;
}

export async function loadSitemapOfertaIds(): Promise<Array<{ id: string; created_at: string }>> {
  const sql = getSql();
  if (sql) {
    const rows = await withSqlTimeout(
      sql<{ id: string; created_at: Date }[]>`
        SELECT id, created_at
        FROM public.ofertas
        WHERE activa = TRUE AND expira_en >= NOW()
        ORDER BY created_at DESC
        LIMIT 5000
      `,
    );
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: String(r.id),
        created_at: new Date(r.created_at).toISOString(),
      }));
    }
  }
  return filterDemoOfertas({}).map((o) => ({ id: o.id, created_at: o.created_at }));
}
