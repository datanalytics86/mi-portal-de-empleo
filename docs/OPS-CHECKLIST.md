# Checklist operativo — mi-portal-de-empleo

Checklist de pre-deploy / post-deploy (Fase 2.1).

## Pre-deploy

- [ ] `npm test` verde en local
- [ ] `npm run build` OK
- [ ] CI verde en el PR (GitHub Actions)
- [ ] Variables en Vercel (Production + Preview si aplica):

| Variable | Obligatoria | Notas |
|----------|-------------|--------|
| `PUBLIC_SUPABASE_URL` | Sí | Auth empleador |
| `PUBLIC_SUPABASE_ANON_KEY` | Sí | |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Nunca en cliente |
| `DATABASE_URL` o `POSTGRES_URL` | Sí (prod) | Neon: listado, perfiles, postulaciones |
| `PUBLIC_SITE_URL` | Recomendada | Canonical / CSRF. Default: `https://mi-portal-de-empleo.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Recomendada | CVs en Vercel Blob; si falta, bucket Supabase `cvs` |
| `UPSTASH_REDIS_REST_URL` | Recomendada prod | Multi-instancia rate limit |
| `UPSTASH_REDIS_REST_TOKEN` | Recomendada prod | |
| `SENTRY_DSN` | Recomendada prod | Errores API / parse |
| `XAI_API_KEY` | Opcional | Mejor parse estructurado |
| `OCR_SPACE_API_KEY` | Opcional | PDFs escaneados en Vercel |
| `CRON_SECRET` | Si usas cron | `/api/cron/limpiar` |

- [ ] Migración SQL aplicada si hay columnas nuevas
- [ ] Bucket Storage `cvs` privado existe

## Post-deploy

- [ ] Home carga y mapa Leaflet muestra markers (CSP no bloquea unpkg/tiles)
- [ ] View Transitions entre páginas sin errores en consola
- [ ] Login empleador OK
- [ ] `POST /api/enlist` con PDF real → 200 `{ok, matches[]}`; el modal muestra 3–6 recomendaciones
- [ ] Postulación a un ID `eeeeeeee-…` del listado → 200 (Neon tiene la fila o se inserta on-write; no FK 500)
- [ ] Postulación zero-friction (sin cuenta) devuelve 200 aunque el parse falle
- [ ] Modal enlist: ESC cierra, foco vuelve al CTA, Tab no sale del dialog
- [ ] Dashboard: desactivar oferta pide confirm (data-confirm, no onclick)
- [ ] Headers: `Content-Security-Policy` con `nonce-` y **sin** `unsafe-inline` en `script-src`
- [ ] Logs Vercel: eventos JSON `parse_cv.complete` / `postulaciones.*`
- [ ] (Si Sentry) evento de prueba o error controlado aparece en el proyecto
- [ ] Rate limit: sin Upstash sigue funcionando (in-memory); con Upstash es multi-instancia

## Branches mergeados (referencia histórica)

| Branch | PR | Estado |
|--------|-----|--------|
| `feature/tier1-hardening` | #11 | Merged → main |
| `feature/tier1-hardening-phase2` | #12 | Merged → main |
| `feature/tier1-phase2-1-ops` | (esta fase) | En curso |

No se borran branches remotos automáticamente; limpiar cuando el equipo lo decida.

## CSP — qué queda y por qué

| Directiva | Estado | Motivo |
|-----------|--------|--------|
| `script-src` | Strict + nonce | Scripts de página reciben nonce por rewrite HTML |
| `script-src-attr` | `none` | Sin `onclick=`; dashboard usa `data-confirm` |
| `style-src 'unsafe-inline'` | **Se mantiene** | Tailwind style attrs, Leaflet, UI |
| `unsafe-eval` | No | No necesario |

Fase 2.2 posible: retirar `unsafe-inline` de styles (migrar a clases / CSS-in-cascade).
