import type { APIRoute } from 'astro';
import { getSql } from '../../lib/neon';

export const GET: APIRoute = async () => {
  const checks: { neon: boolean; supabase: boolean; blob: boolean } = {
    neon: false,
    supabase: false,
    blob: Boolean(import.meta.env.BLOB_READ_WRITE_TOKEN),
  };

  try {
    const sql = getSql();
    if (sql) {
      const rows = await sql`SELECT 1 AS ok`;
      checks.neon = Boolean(rows[0]);
    }
  } catch {
    checks.neon = false;
  }

  checks.supabase = Boolean(
    import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  );

  const ok = checks.neon || checks.supabase;
  return new Response(JSON.stringify({ ok, ...checks }), {
    status: ok ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
