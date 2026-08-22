import { getSql } from './neon';
import { storeCvFile } from './cv-store';

function requireSql() {
  const sql = getSql();
  if (!sql) throw new Error('DATABASE_URL no configurada');
  return sql;
}

export async function insertPerfil(row: {
  nombre: string | null;
  email: string | null;
  cv_url: string;
  ip_address: string | null;
}): Promise<{ id: string }> {
  const sql = requireSql();
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
