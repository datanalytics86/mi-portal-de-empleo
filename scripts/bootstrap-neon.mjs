/**
 * Crea esquema + 1100 ofertas demo en Neon (DATABASE_URL).
 * Uso: node scripts/bootstrap-neon.mjs [ruta.env]
 */
import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import {
  DEMO_EMPLEADOR_ID,
  DEMO_EMPLEADOR_EMAIL,
  DEMO_EMPLEADOR_EMPRESA,
  buildDemoOfertas,
} from './demo-data.mjs';

function loadEnvFile(p) {
  const env = {};
  for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i < 0) continue;
    let v = l.slice(i + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[l.slice(0, i)] = v;
  }
  return env;
}

const envPath = process.argv[2];
const fileEnv = envPath ? loadEnvFile(envPath) : {};
const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  fileEnv.DATABASE_URL ||
  fileEnv.POSTGRES_URL;

if (!url) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require', max: 1, idle_timeout: 5 });

const DDL = `
CREATE TABLE IF NOT EXISTS public.empleadores (
  id         UUID PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  empresa    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ofertas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       TEXT NOT NULL,
  descripcion  TEXT NOT NULL,
  empresa      TEXT NOT NULL,
  tipo_empleo  TEXT NOT NULL CHECK (tipo_empleo IN ('full-time', 'part-time', 'freelance', 'practica')),
  categoria    TEXT NOT NULL,
  comuna       TEXT NOT NULL,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  activa       BOOLEAN NOT NULL DEFAULT TRUE,
  expira_en    TIMESTAMPTZ NOT NULL,
  empleador_id UUID NOT NULL REFERENCES public.empleadores(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_demo      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ofertas_activa_expira ON public.ofertas (activa, expira_en);
CREATE INDEX IF NOT EXISTS idx_ofertas_empleador ON public.ofertas (empleador_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_tipo ON public.ofertas (tipo_empleo);
CREATE INDEX IF NOT EXISTS idx_ofertas_is_demo ON public.ofertas (is_demo);
CREATE INDEX IF NOT EXISTS idx_ofertas_created ON public.ofertas (created_at DESC);

CREATE TABLE IF NOT EXISTS public.postulaciones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id      UUID NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
  nombre         TEXT,
  email          TEXT,
  cv_url         TEXT NOT NULL,
  ip_address     TEXT,
  palabras_clave TEXT[] DEFAULT '{}',
  keywords       TEXT[] DEFAULT '{}',
  cv_parsed      JSONB,
  parse_status   TEXT DEFAULT 'pending'
                   CHECK (parse_status IS NULL OR parse_status IN ('pending', 'success', 'failed', 'skipped')),
  parsed_at      TIMESTAMPTZ,
  match_score    SMALLINT CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100)),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_postulaciones_oferta ON public.postulaciones (oferta_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_created ON public.postulaciones (created_at);
CREATE INDEX IF NOT EXISTS idx_postulaciones_parse_status ON public.postulaciones (parse_status);

CREATE TABLE IF NOT EXISTS public.perfiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         TEXT,
  email          TEXT,
  cv_url         TEXT NOT NULL,
  ip_address     TEXT,
  keywords       TEXT[] DEFAULT '{}',
  cv_parsed      JSONB,
  parse_status   TEXT DEFAULT 'pending'
                   CHECK (parse_status IS NULL OR parse_status IN ('pending', 'success', 'failed', 'skipped')),
  parsed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfiles_created ON public.perfiles (created_at);
CREATE INDEX IF NOT EXISTS idx_perfiles_parse_status ON public.perfiles (parse_status);
CREATE INDEX IF NOT EXISTS idx_perfiles_email ON public.perfiles (email);
`;

async function main() {
  console.log('DDL…');
  await sql.unsafe(DDL);

  await sql`
    INSERT INTO public.empleadores (id, email, empresa)
    VALUES (${DEMO_EMPLEADOR_ID}, ${DEMO_EMPLEADOR_EMAIL}, ${DEMO_EMPLEADOR_EMPRESA})
    ON CONFLICT (id) DO NOTHING
  `;

  const rows = buildDemoOfertas();
  console.log('Insertando', rows.length, 'ofertas…');
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH).map((r) => ({
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      empresa: r.empresa,
      tipo_empleo: r.tipo_empleo,
      categoria: r.categoria,
      comuna: r.comuna,
      lat: r.lat,
      lng: r.lng,
      activa: r.activa,
      expira_en: r.expira_en,
      empleador_id: r.empleador_id,
      created_at: r.created_at,
      is_demo: r.is_demo,
    }));
    const res = await sql`
      INSERT INTO public.ofertas ${sql(slice)}
      ON CONFLICT (id) DO NOTHING
    `;
    inserted += res.count ?? slice.length;
    if ((i / BATCH) % 4 === 0) console.log('  ', i + slice.length, '/', rows.length);
  }

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM public.ofertas`;
  const [{ demos }] = await sql`SELECT COUNT(*)::int AS demos FROM public.ofertas WHERE is_demo = true`;
  console.log('OK ofertas=', count, 'is_demo=', demos, 'batch_count=', inserted);
  await sql.end({ timeout: 2 });
}

main().catch(async (err) => {
  console.error(err);
  try {
    await sql.end({ timeout: 1 });
  } catch {
    /* ignore */
  }
  process.exit(1);
});
