/**
 * Crea/actualiza las cuentas demo de empleador en Supabase Auth
 * (y la fila public.empleadores). No usa identidades reales.
 *
 * Uso:
 *   node scripts/ensure-demo-empleadores.mjs [ruta.env]
 *
 * Requiere PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Si hay DATABASE_URL, también upserta empleadores en Neon.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const ACCOUNTS = [
  {
    id: 'aaaaaaaa-1111-1111-1111-000000000001',
    email: 'test-empresa1@test.cl',
    password: 'TestPass123!',
    empresa: 'TechCorp Chile',
  },
  {
    id: 'aaaaaaaa-2222-2222-2222-000000000002',
    email: 'test-empresa2@test.cl',
    password: 'TestPass123!',
    empresa: 'Salud Conecta',
  },
  {
    id: 'eeeeeeee-0000-4000-8000-000000000000',
    email: 'demo-ofertas@portal.cl',
    password: 'DemoPass123!',
    empresa: 'Portal Demo Chile',
  },
];

function loadEnvFile(p) {
  const env = {};
  for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i < 0) continue;
    let v = l.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[l.slice(0, i)] = v;
  }
  return env;
}

const fileEnv = process.argv[2] ? loadEnvFile(process.argv[2]) : {};
const url = process.env.PUBLIC_SUPABASE_URL || fileEnv.PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL || fileEnv.DATABASE_URL || process.env.POSTGRES_URL || fileEnv.POSTGRES_URL;

if (!url || !service) {
  console.error('Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });

async function findUserIdByEmail(email) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < perPage) return null;
    page += 1;
    if (page > 20) return null;
  }
}

async function ensureAuthUser(acc) {
  const existingId = await findUserIdByEmail(acc.email);
  if (existingId) {
    const { error } = await admin.auth.admin.updateUserById(existingId, {
      password: acc.password,
      email_confirm: true,
      user_metadata: { empresa: acc.empresa },
    });
    if (error) throw error;
    return existingId;
  }
  const { data, error } = await admin.auth.admin.createUser({
    id: acc.id,
    email: acc.email,
    password: acc.password,
    email_confirm: true,
    user_metadata: { empresa: acc.empresa },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  for (const acc of ACCOUNTS) {
    const id = await ensureAuthUser(acc);
    const { error } = await admin.from('empleadores').upsert(
      { id, email: acc.email, empresa: acc.empresa },
      { onConflict: 'id' },
    );
    if (error) {
      console.warn('empleadores upsert', acc.email, error.message);
    }
    console.log('OK', acc.email, id);
  }

  if (databaseUrl) {
    const postgres = (await import('postgres')).default;
    const sql = postgres(databaseUrl, { ssl: 'require', max: 1 });
    try {
      for (const acc of ACCOUNTS) {
        await sql`
          INSERT INTO public.empleadores (id, email, empresa)
          VALUES (${acc.id}::uuid, ${acc.email}, ${acc.empresa})
          ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, empresa = EXCLUDED.empresa
        `;
      }
      console.log('OK neon empleadores');
    } finally {
      await sql.end({ timeout: 2 });
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
