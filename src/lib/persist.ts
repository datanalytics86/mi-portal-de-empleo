import { getSql } from './neon';
import { storeCvFile } from './cv-store';
import { WRITE_SCHEMA_SQL } from './write-schema';
import {
  DEMO_EMPLEADOR_EMAIL,
  DEMO_EMPLEADOR_EMPRESA,
  DEMO_EMPLEADOR_ID,
  getDemoOferta,
  getDemoOfertas,
  type PublicOferta,
} from './demo-catalog';
import { log } from './observability';

function requireSql() {
  const sql = getSql();
  if (!sql) throw new Error('DATABASE_URL no configurada');
  return sql;
}

let schemaReady: Promise<void> | null = null;
let catalogSeed: Promise<void> | null = null;

export async function ensureWriteSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = requireSql();
    await sql.unsafe(WRITE_SCHEMA_SQL);
  })().catch((err) => {
    schemaReady = null;
    throw err;
  });
  return schemaReady;
}

async function upsertEmpleadorDemo(): Promise<void> {
  const sql = requireSql();
  await sql`
    INSERT INTO public.empleadores (id, email, empresa)
    VALUES (${DEMO_EMPLEADOR_ID}::uuid, ${DEMO_EMPLEADOR_EMAIL}, ${DEMO_EMPLEADOR_EMPRESA})
    ON CONFLICT (id) DO NOTHING
  `;
}

function ofertaInsertRow(o: PublicOferta) {
  return {
    id: o.id,
    titulo: o.titulo,
    descripcion: o.descripcion,
    empresa: o.empresa,
    tipo_empleo: o.tipo_empleo,
    categoria: o.categoria,
    comuna: o.comuna,
    lat: o.lat,
    lng: o.lng,
    activa: o.activa,
    expira_en: o.expira_en,
    empleador_id: o.empleador_id,
    created_at: o.created_at,
    is_demo: true,
  };
}

/** Si el ID es del catálogo demo y no está en Neon, lo inserta (evita FK 500). */
export async function ensureDemoOferta(id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await ensureWriteSchema();
  const existing = await sql<{ id: string }[]>`
    SELECT id FROM public.ofertas WHERE id = ${id}::uuid LIMIT 1
  `;
  if (existing[0]) return true;
  const demo = getDemoOferta(id);
  if (!demo) return false;
  await upsertEmpleadorDemo();
  const row = ofertaInsertRow(demo);
  await sql`
    INSERT INTO public.ofertas ${sql(row)}
    ON CONFLICT (id) DO NOTHING
  `;
  return true;
}

/** Si Neon está vacío, siembra las 1100 demo (idempotente). Pensado para waitUntil. */
export async function ensureDemoCatalogSeeded(): Promise<void> {
  if (catalogSeed) return catalogSeed;
  catalogSeed = (async () => {
    const sql = getSql();
    if (!sql) return;
    await ensureWriteSchema();
    const [{ count }] = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM public.ofertas
    `;
    if ((count ?? 0) > 0) return;
    await upsertEmpleadorDemo();
    const rows = getDemoOfertas();
    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH).map(ofertaInsertRow);
      await sql`INSERT INTO public.ofertas ${sql(slice)} ON CONFLICT (id) DO NOTHING`;
    }
    log.info('persist.demo_catalog_seeded', { count: rows.length });
  })().catch((err) => {
    catalogSeed = null;
    log.error('persist.demo_catalog_seed_failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  });
  return catalogSeed;
}

export async function insertPerfil(row: {
  nombre: string | null;
  email: string | null;
  cv_url: string;
  ip_address: string | null;
}): Promise<{ id: string }> {
  const sql = requireSql();
  await ensureWriteSchema();
  const rows = await sql<{ id: string }[]>`
    INSERT INTO public.perfiles (nombre, email, cv_url, ip_address, parse_status, keywords)
    VALUES (${row.nombre}, ${row.email}, ${row.cv_url}, ${row.ip_address}, 'pending', '{}')
    RETURNING id
  `;
  const id = rows[0]?.id;
  if (!id) throw new Error('No se pudo guardar el perfil');
  return { id };
}

export async function updatePerfil(
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const sql = requireSql();
  const nombre = (payload.nombre as string | undefined) ?? null;
  const email = (payload.email as string | undefined) ?? null;
  const parseStatus = (payload.parse_status as string | undefined) ?? null;
  const parsedAt = (payload.parsed_at as string | undefined) ?? null;
  const keywords = Array.isArray(payload.keywords) ? (payload.keywords as string[]) : null;
  const cvParsedJson =
    payload.cv_parsed === undefined || payload.cv_parsed === null
      ? null
      : JSON.stringify(payload.cv_parsed);
  await sql`
    UPDATE public.perfiles SET
      nombre = COALESCE(${nombre}, nombre),
      email = COALESCE(${email}, email),
      parse_status = COALESCE(${parseStatus}, parse_status),
      parsed_at = COALESCE(${parsedAt}::timestamptz, parsed_at),
      keywords = COALESCE(${keywords}, keywords),
      cv_parsed = COALESCE(${cvParsedJson}::jsonb, cv_parsed)
    WHERE id = ${id}::uuid
  `;
}

export async function insertPostulacion(row: {
  oferta_id: string;
  nombre: string | null;
  email: string | null;
  cv_url: string;
  ip_address: string | null;
}): Promise<{ id: string }> {
  const sql = requireSql();
  await ensureWriteSchema();
  await ensureDemoOferta(row.oferta_id);
  const rows = await sql<{ id: string }[]>`
    INSERT INTO public.postulaciones (
      oferta_id, nombre, email, cv_url, ip_address, parse_status, palabras_clave, keywords
    )
    VALUES (
      ${row.oferta_id}::uuid, ${row.nombre}, ${row.email}, ${row.cv_url}, ${row.ip_address},
      'pending', '{}', '{}'
    )
    RETURNING id
  `;
  const id = rows[0]?.id;
  if (!id) throw new Error('No se pudo guardar la postulación');
  return { id };
}

export async function updatePostulacion(
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const sql = requireSql();
  const nombre = (payload.nombre as string | undefined) ?? null;
  const email = (payload.email as string | undefined) ?? null;
  const parseStatus = (payload.parse_status as string | undefined) ?? null;
  const parsedAt = (payload.parsed_at as string | undefined) ?? null;
  const keywords = Array.isArray(payload.keywords) ? (payload.keywords as string[]) : null;
  const cvParsedJson =
    payload.cv_parsed === undefined || payload.cv_parsed === null
      ? null
      : JSON.stringify(payload.cv_parsed);
  const matchScore =
    typeof payload.match_score === 'number' ? (payload.match_score as number) : null;
  await sql`
    UPDATE public.postulaciones SET
      nombre = COALESCE(${nombre}, nombre),
      email = COALESCE(${email}, email),
      parse_status = COALESCE(${parseStatus}, parse_status),
      parsed_at = COALESCE(${parsedAt}::timestamptz, parsed_at),
      keywords = COALESCE(${keywords}, keywords),
      palabras_clave = COALESCE(${keywords}, palabras_clave),
      cv_parsed = COALESCE(${cvParsedJson}::jsonb, cv_parsed),
      match_score = COALESCE(${matchScore}, match_score)
    WHERE id = ${id}::uuid
  `;
}

export { storeCvFile };
