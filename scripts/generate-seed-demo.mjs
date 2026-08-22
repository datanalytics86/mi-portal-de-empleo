/**
 * Genera scripts/seed-demo-1000.sql desde demo-data.mjs.
 * NO aplicar el SQL en prod (artefacto). Preferir: npm run seed:neon
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDemoOfertas, DEMO_EMPLEADOR_ID } from './demo-data.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));

function esc(s) {
  return String(s).replace(/'/g, "''");
}

const now = Date.now();
const rows = buildDemoOfertas(now);
const EMP_ID = DEMO_EMPLEADOR_ID;
const BATCH = 50;
const chunks = [];

for (let i = 0; i < rows.length; i += BATCH) {
  const slice = rows.slice(i, i + BATCH);
  const values = slice
    .map((r) => {
      const daysLive = Math.max(1, Math.round((new Date(r.expira_en).getTime() - now) / 86400000));
      const daysAgo = Math.max(0, Math.round((now - new Date(r.created_at).getTime()) / 86400000));
      return (
        `  ('${r.id}', '${esc(r.titulo)}', '${esc(r.descripcion)}', '${esc(r.empresa)}', '${r.tipo_empleo}', '${esc(r.categoria)}',` +
        `\n   '${esc(r.comuna)}', ${r.lat}, ${r.lng}, TRUE,` +
        `\n   NOW() + INTERVAL '${daysLive} days', '${EMP_ID}',` +
        `\n   NOW() - INTERVAL '${daysAgo} days', TRUE)`
      );
    })
    .join(',\n');
  chunks.push(`INSERT INTO public.ofertas (
  id, titulo, descripcion, empresa, tipo_empleo, categoria,
  comuna, lat, lng, activa, expira_en, empleador_id, created_at, is_demo
) VALUES
${values}
ON CONFLICT (id) DO NOTHING;`);
}

const sql = `-- NO APLICAR EN PROD. El histórico filtraba "(is_demo)" en el texto.
-- Regen del listado: npm run seed:neon (scripts/bootstrap-neon.mjs + demo-data.mjs).
-- Auth de empleadores: node scripts/ensure-demo-empleadores.mjs (no este SQL).
-- 1100 ofertas ficticias (is_demo = true). Idempotente. No toca ofertas reales.

BEGIN;

INSERT INTO public.empleadores (id, email, empresa, created_at)
VALUES ('${EMP_ID}', 'demo-ofertas@portal.cl', 'Portal Demo Chile', NOW())
ON CONFLICT (id) DO NOTHING;

${chunks.join('\n\n')}

COMMIT;

-- SELECT COUNT(*) FROM public.ofertas WHERE is_demo = true;
`;

writeFileSync(join(__dir, 'seed-demo-1000.sql'), sql);
console.log('Wrote scripts/seed-demo-1000.sql rows=', rows.length, '(do not apply in prod)');
