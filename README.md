# mi-portal-de-empleo

Portal de reclutamiento **minimalista** para Chile.

Candidatos postulan **sin registro** (solo suben su CV). Empleadores publican ofertas georeferenciadas y reciben postulaciones con **palabras clave y resumen extraídos automáticamente** del CV.

| | |
|---|---|
| **Live** | [mi-portal-de-empleo.vercel.app](https://mi-portal-de-empleo.vercel.app) — **seed de 1100 ofertas de demostración** (`is_demo=true`). No son clientes reales. |
| **Repo** | [github.com/datanalytics86/mi-portal-de-empleo](https://github.com/datanalytics86/mi-portal-de-empleo) |
| **Stack** | Astro 5 · TypeScript · Tailwind · Supabase · Vercel |

---

## Características principales

- **Zero-friction para candidatos** — nombre y email opcionales; solo se exige el CV (PDF/DOCX ≤ 5 MB).
- **Mapa de ofertas** — Leaflet + comunas de Chile; filtros por texto, jornada y comuna.
- **Parsing automático de CVs (Tier 1)**
  - Extracción de texto (PDF nativo, DOCX; OCR opcional para PDFs escaneados).
  - Keywords / skills orientadas al mercado laboral chileno.
  - Datos estructurados (`cv_parsed`): perfil, experiencia, educación, idiomas, ubicación.
  - Score de afinidad CV ↔ oferta (`match_score` 0–100).
  - **Fail-open:** si el parse falla, la postulación y el CV se guardan igual.
- **Dashboard empleador** — tags de keywords, resumen del CV, % match, filtro por skill, export CSV.
- **Privacidad** — CVs en bucket privado; retención ~90 días (cron de limpieza).
- **Rate limiting** — postulaciones (3/IP/h); login (10/15 min) y registro (5/h) por **IP + email** (el más restrictivo gana). Upstash Redis opcional; fallback in-memory.
- **Security headers** — CSP **strict** con nonce por request (HTML rewrite inyecta nonces en `<script>`); sin `unsafe-inline` en `script-src`. `style-src` aún permite inline (Tailwind/Leaflet). HSTS, COOP, Permissions-Policy.
- **Paginación** — ofertas públicas y dashboard; postulaciones con `ORDER BY match_score NULLS LAST` + `range` nativo (CSV exporta el set completo).
- **CI** — GitHub Actions: `npm ci` → `npm test` → `npm run build` en PR y push a `main`.
- **Observabilidad** — logs JSON estructurados + Sentry opcional (`SENTRY_DSN`).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend / API | Astro 5 (SSR), TypeScript, Tailwind CSS |
| Mapa | Leaflet + OpenStreetMap |
| Datos públicos + postulaciones + perfiles | **Neon (PostgreSQL)** — `DATABASE_URL` / `POSTGRES_URL` |
| Auth empleador + storage fallback | **Supabase** (Auth JWT, bucket `cvs` si no hay Blob) |
| CV parse | `pdf-parse`, `mammoth`, Zod; OCR (`tesseract` / OCR.space); LLM opcional (xAI Grok) |
| Matching | Overlap de keywords CV ↔ título/descripción/categoría (`src/lib/recommend.ts`) |
| Deploy | Vercel (+ Blob opcional para CVs) |

**Neon vs Supabase:** el listado, el mapa, `/api/enlist` y `/api/postulaciones` leen y escriben en Neon. El dashboard empleador (sesión, crear oferta) sigue en Supabase Auth + PostgREST. Los IDs demo `eeeeeeee-…` son los mismos en el catálogo en memoria y en Neon; si una oferta se ve en el listado (fallback) y aún no está en Neon, la postulación la **inserta** antes del FK.

## Matching (enlist)

```
POST /api/enlist
  → valida CV + guarda perfil (parse_status=pending)
  → extrae keywords (rápido, fail-open ≤2.5s)
  → 200 { ok, id, keywords, matches[3–6] }
  → background: parse completo + seed del catálogo si Neon estaba vacío
```

El success del modal pinta esas ofertas. Score 0–100 (overlap + bonus categoría/comuna). Sin texto extraíble, igual se muestran 6 ofertas diversas.

---

## Inicio rápido

```bash
git clone https://github.com/datanalytics86/mi-portal-de-empleo.git
cd mi-portal-de-empleo
cp .env.example .env   # completar claves Supabase
npm install
npm run dev            # http://localhost:4321
```

### Variables de entorno

**Obligatorias**

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_SITE_URL=https://mi-portal-de-empleo.vercel.app
DATABASE_URL=                 # Neon — listado, enlist, postulaciones
BLOB_READ_WRITE_TOKEN=        # Vercel Blob (CVs). Si falta, se usa Storage de Supabase
```

**Opcionales (mejor calidad de parsing)**

```env
XAI_API_KEY=              # structured parse con Grok
XAI_MODEL=grok-3-mini
OCR_SPACE_API_KEY=        # OCR cloud para PDFs escaneados (recomendado en Vercel)
CV_OCR_ENABLED=true
CV_OCR_MAX_PAGES=3

# Rate limiting distribuido (recomendado en Vercel multi-instancia)
UPSTASH_REDIS_REST_URL=   # https://console.upstash.com → Redis → REST URL
UPSTASH_REDIS_REST_TOKEN= # REST TOKEN

# Observabilidad (opcional)
SENTRY_DSN=               # https://sentry.io → Client Keys (DSN)
```

Sin Upstash la app sigue funcionando con rate limit **in-memory por instancia** (suficiente en local y en un solo proceso).  
Sin Sentry: solo logs estructurados en consola/Vercel; **fail-soft** (la app no depende del DSN).

Ver `.env.example` completo.

> **Producción multi-instancia:** configura **Upstash** en Vercel. Sin Redis el rate limit es por instancia y se diluye entre cold starts.

### Base de datos

1. **Proyecto nuevo:** ejecutar `schema.sql` en Supabase → SQL Editor.  
2. **Proyecto existente (solo columnas de parse):** ejecutar `scripts/migration-cv-parse.sql`.  
3. Crear bucket Storage `cvs` (privado) si no existe (también en `schema.sql`).

### Datos de prueba (seed)

Hay **dos** semillas. No son intercambiables.

| Script | Qué crea | Dónde |
|--------|----------|--------|
| `scripts/seed.sql` | 2 empleadores + **12** ofertas + postulaciones con `keywords` / `match_score` | Supabase SQL Editor (`auth.users` + tablas públicas) |
| `scripts/seed-demo-1000.sql` | **No usar** en prod (texto con `(is_demo)`). Preferir el generador | — |
| `scripts/bootstrap-neon.mjs` | DDL + las mismas **1100** ofertas demo | Neon (`DATABASE_URL`). Es lo que alimenta el listado público en prod |
| `scripts/seed-expired-fixture.sql` | 1 oferta expirada (`…e410`) para QA **410** | Neon o Supabase. No reescribe los IDs de las 1100 |
| `scripts/ensure-demo-empleadores.mjs` | Recrea las cuentas Auth (password incluido) | Service role. Hace falta si el login 401 después de sembrar solo Neon |

```text
# Listado público 1100 (Neon)
node scripts/bootstrap-neon.mjs .env.local

# Cuentas para /empleador/login (Supabase Auth)
node scripts/ensure-demo-empleadores.mjs .env.local

# Fixture 410
psql $DATABASE_URL -f scripts/seed-expired-fixture.sql
```

**Live:** el acceso demo **no está activo**. Sembrar Neon (`bootstrap-neon.mjs`) **no** crea usuarios de Supabase Auth. Para login local, corre `ensure-demo-empleadores.mjs` contra el proyecto de Auth (no publiques esas claves en la UI).

| Cuenta (solo seed local) | Empresa |
|--------|---------|
| `test-empresa1@test.cl` | TechCorp Chile |
| `test-empresa2@test.cl` | Salud Conecta |
| `demo-ofertas@portal.cl` | Portal Demo Chile |

No uses `scripts/seed-demo-1000.sql` crudo (el texto incluye el leak `(is_demo)`). Regen: `npm run seed:neon`.

Las 1100 ofertas públicas **no** salen de `seed.sql` (solo 12). El listado en [mi-portal-de-empleo.vercel.app](https://mi-portal-de-empleo.vercel.app) se sirve desde Neon (`is_demo=true`). Sembrar solo `seed.sql` no llena el home.

Si el login falla con cuentas de esta tabla, corre `ensure-demo-empleadores.mjs` contra el proyecto de `PUBLIC_SUPABASE_URL`. El SQL de Neon **no** crea usuarios de Supabase Auth.

---

## Parsing de CVs (resumen)

```
Candidato sube CV
  → POST /api/postulaciones
  → Validación (MIME + magic bytes + 5 MB + rate limit)
  → Upload → bucket cvs
  → INSERT postulaciones (parse_status = pending)
  → 200 inmediato al candidato
  → Background: extract text → rules ± LLM ± OCR → UPDATE keywords, cv_parsed, match_score
```

Documentación detallada:

| Documento | Contenido |
|-----------|-----------|
| [SPECIFICATIONS.md](./SPECIFICATIONS.md) | Producto + sección completa de parsing |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Estructura, pipeline, componentes |
| [DEPLOY-CV-PARSE.md](./DEPLOY-CV-PARSE.md) | Deploy, env, Edge Function, checklist |
| [docs/OPS-CHECKLIST.md](./docs/OPS-CHECKLIST.md) | Pre/post-deploy, CSP, branches mergeados |

---

## CI (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

| Trigger | Jobs |
|---------|------|
| `pull_request` → `main` | Node 22 · `npm ci` · `npm test` · `npm run build` |
| `push` → `main` | Igual |

- Cache de npm vía `actions/setup-node`
- El job **falla** si tests o build fallan
- Build usa placeholders de Supabase (no se necesitan secrets reales en CI)

```bash
# Equivalente local
npm ci
npm test
npm run build
```

---

## Observabilidad

| Capa | Comportamiento |
|------|----------------|
| **Logs** | JSON por línea (`ts`, `level`, `event`, campos). Ej: `parse_cv.complete`, `postulaciones.parse_persisted` |
| **Sentry** | Si `SENTRY_DSN` está definido, captura excepciones de API/parse. Sin DSN → no-op |
| **Parse** | Cada run emite `status`, `method` (rule/llm/hybrid/ocr), `duration_ms`, keywords, OCR |

Instrumentación principal: `src/lib/observability/`, `src/lib/cv-parser/index.ts`, APIs de auth/postulaciones.

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:watch` | Vitest en modo watch |
| `npm run seed:neon` | DDL + 1100 ofertas demo en Neon (`scripts/bootstrap-neon.mjs`) |
| `node scripts/ensure-demo-empleadores.mjs [env]` | Recrea `test-empresa*@test.cl` y `demo-ofertas@portal.cl` |

---

## Estructura relevante

```
src/
  lib/cv-parser/          # Orquestador + extractores + keywords + OCR + match
  lib/observability/      # Logger JSON + Sentry fail-soft
  lib/rate-limit.ts
  lib/security-headers.ts
  pages/api/postulaciones.ts
  pages/empleador/oferta/[id]/postulaciones.astro
  pages/oferta/[id].astro
.github/workflows/ci.yml
docs/OPS-CHECKLIST.md
schema.sql
scripts/migration-cv-parse.sql
supabase/functions/parse-cv/
```

---

## Cómo integrar cambios (paso a paso)

1. Aplicar migración SQL si la DB aún no tiene `keywords`, `cv_parsed`, `parse_status`, `parsed_at`, `match_score`.  
2. Configurar env en local y en Vercel (mínimo service role).  
3. `npm install && npm run build` — verificar que compila.  
4. Deploy a Vercel (o push a la rama conectada).  
5. Probar: postular con un PDF con texto → en dashboard deben verse tags de keywords.  
6. (Opcional) `OCR_SPACE_API_KEY` y/o `XAI_API_KEY` para OCR y parse de mayor calidad.

---

## Licencia

Uso del repositorio según el autor del proyecto.
