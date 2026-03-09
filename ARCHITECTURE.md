# Architecture — Mi Portal de Empleo

## 1. Project Structure

```
mi-portal-de-empleo/
├── src/
│   ├── layouts/Layout.astro        # Base HTML layout (header, footer, global scripts)
│   ├── middleware.ts               # Route protection for employer pages and API
│   ├── lib/
│   │   ├── supabase.ts             # Supabase clients (public + service role)
│   │   ├── auth.ts                 # Cookie-based session management
│   │   ├── constants.ts            # TIPOS, CATEGORIAS, CATEGORIA_COLORS
│   │   ├── comunas.ts              # Chilean comunas with lat/lng coordinates
│   │   ├── extract-text.ts         # PDF/DOCX text extraction (pdf-parse, mammoth)
│   │   └── extract-keywords.ts     # Keyword extraction from CV text
│   ├── types/database.ts           # Supabase Database type definitions
│   └── pages/
│       ├── index.astro             # Homepage (search, map, offer list)
│       ├── oferta/[id].astro       # Offer detail + application form
│       ├── privacidad.astro        # Privacy policy
│       ├── 404.astro               # Not found
│       ├── sitemap.xml.ts          # Dynamic XML sitemap
│       ├── robots.txt.ts           # robots.txt
│       ├── empleador/              # Employer-authenticated pages
│       │   ├── login.astro
│       │   ├── registro.astro
│       │   ├── dashboard.astro
│       │   └── oferta/
│       │       ├── nueva.astro
│       │       ├── [id]/editar.astro
│       │       └── [id]/postulaciones.astro
│       └── api/                    # Server API routes
│           ├── auth/{login,registro,logout}.ts
│           ├── ofertas/{nueva,editar,desactivar}.ts
│           ├── postulaciones.ts
│           ├── postulaciones/cv.ts
│           └── cron/limpiar.ts
├── public/                         # Static assets (favicon.svg)
├── schema.sql                      # Supabase database schema
├── SPECIFICATIONS.md               # Original product spec
├── CLAUDE.md                       # AI agent context (read this first)
├── astro.config.mjs                # Astro config (SSR + Vercel + Tailwind)
├── tailwind.config.mjs             # Tailwind config (brand colors, Inter font)
└── package.json                    # Node 22.x, Astro 5, Supabase, Zod
```

## 2. System Diagram

```
[Candidate Browser]                    [Employer Browser]
        │                                      │
        ▼                                      ▼
┌──────────────────────────────────────────────────┐
│              Vercel (SSR)                        │
│  ┌─────────────────────────────────────────────┐ │
│  │ Astro 5 Server                              │ │
│  │  ├── Pages (SSR on each request)            │ │
│  │  ├── API Routes (/api/*)                    │ │
│  │  ├── Middleware (auth guard)                 │ │
│  │  └── Leaflet map (CDN, client-side)         │ │
│  └─────────────────────────────────────────────┘ │
└──────────────┬────────────────┬──────────────────┘
               │                │
               ▼                ▼
┌──────────────────┐  ┌──────────────────┐
│ Supabase Auth    │  │ Supabase Storage │
│ (email+password) │  │ (bucket: cvs)    │
└──────────────────┘  └──────────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Supabase PostgreSQL          │
│  ├── empleadores (employers) │
│  ├── ofertas (job offers)    │
│  └── postulaciones (apps)    │
│  RLS policies enforced       │
└──────────────────────────────┘
```

## 3. Core Components

### 3.1. Frontend (Astro 5 SSR)

- **Framework**: Astro 5 with `output: 'server'` — every page is server-rendered
- **Styling**: Tailwind CSS 3 with custom `brand` color palette (blue-based, defined in tailwind.config.mjs)
- **Font**: Inter via Google Fonts
- **Maps**: Leaflet 1.9.4 loaded via CDN `<script>` tag (NOT npm). Used in `<script define:vars>` blocks
- **Navigation**: Astro ViewTransitions for SPA-like page transitions
- **Adapter**: `@astrojs/vercel` for Vercel serverless deployment

### 3.2. Authentication

- Supabase Auth with email+password
- Cookie-based sessions: JWT stored in `sb-session` cookie (httpOnly, 1hr TTL)
- `src/lib/auth.ts`: `getEmpleadorSession()` validates token and returns user+employer data
- `src/middleware.ts`: guards `/empleador/*` pages (redirect to login) and `/api/ofertas/*` routes (401)

### 3.3. API Routes

All under `src/pages/api/`. Key patterns:
- **Public**: `POST /api/postulaciones` (rate-limited by IP, 3/hour)
- **Authenticated**: `POST /api/ofertas/*` (checked by middleware + ownership validation)
- **Service role**: Server-side operations use `createServiceClient()` to bypass RLS
- **Validation**: Zod schemas for all form inputs

### 3.4. Data Access

Two Supabase clients in `src/lib/supabase.ts`:
1. `supabase` — public anon client for reading active offers
2. `createServiceClient()` — service role client for mutations (inserts, updates, storage)

## 4. Data Stores

### 4.1. PostgreSQL (via Supabase)

**Tables** (see `schema.sql` for full DDL):

| Table | Purpose | RLS |
|-------|---------|-----|
| `empleadores` | Employer profiles (linked to auth.users) | Own data only |
| `ofertas` | Job offers with geo-coordinates | Public read (active), employer CRUD |
| `postulaciones` | Applications with CV reference | Employer read (own offers), public insert |

**Key indexes**: `(activa, expira_en)`, `(empleador_id)`, `(tipo_empleo)`, `(oferta_id)`, `(created_at)`

**Triggers**: `trg_ofertas_updated_at` auto-updates `updated_at` on row changes.

### 4.2. Supabase Storage

- Bucket: `cvs` (private)
- CVs uploaded server-side via service role
- Downloaded via signed URLs (employer must own the associated offer)

## 5. External Integrations

| Service | Purpose | Method |
|---------|---------|--------|
| Supabase | Database, Auth, Storage | JS SDK (`@supabase/supabase-js`) |
| OpenStreetMap | Map tiles | Leaflet tile layer (CDN) |
| Google Fonts | Inter typeface | CSS link in Layout.astro |

## 6. Deployment & Infrastructure

- **Host**: Vercel (serverless functions via `@astrojs/vercel`)
- **Backend**: Supabase Cloud (managed PostgreSQL + Auth + Storage)
- **CI/CD**: Git push to branch → Vercel Preview → promote to Production
- **Environment**: Variables set in Vercel dashboard (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

## 7. Security

- **Auth**: Supabase Auth (email+password), JWT in httpOnly cookie
- **Authorization**: RLS policies on all tables + middleware route guards + API ownership checks
- **Rate limiting**: 3 applications per IP per hour (checked server-side)
- **File validation**: Type (PDF/DOCX only), size (5MB max), server-side re-validation
- **Data retention**: 90-day auto-cleanup via `/api/cron/limpiar`
- **Privacy**: Consent checkbox required, privacy policy page, Chilean Ley 19.628 compliance

## 8. Development

```bash
npm install          # Install dependencies
npm run dev          # Dev server at localhost:4321
npm run build        # Production build (verifies compilation)
```

No test framework configured. Verify with `npm run build`.

## 9. Key Design Patterns

- **Self-contained pages**: No shared components directory; all UI is inline in `.astro` pages
- **Pre-computed values**: Complex expressions are computed in `.map()` callback bodies to avoid Astro template literal issues
- **define:vars scripts**: Use `/* */` comments, `var` declarations, and `function()` syntax (see CLAUDE.md for details)
- **Service client pattern**: Public reads use anon client; mutations use service role client to bypass RLS while still validating ownership in application code

## 10. Project Identification

- **Project**: Mi Portal de Empleo
- **Repository**: datanalytics86/mi-portal-de-empleo
- **Stack**: Astro 5 + Supabase + Tailwind + Leaflet + Vercel
- **Last Updated**: 2026-03-09
