# CLAUDE.md — Project Context for AI Agents

## Project Overview

**Mi Portal de Empleo** — A job portal for Chile. Candidates browse/filter offers on an interactive map and apply with their CV (zero registration). Employers register, post offers, and manage applications.

- **Live URL**: Deployed on Vercel (SSR mode)
- **Branch**: `claude/review-web-functionality-irseu`
- **Last working commit**: `cb28430`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 5 (`output: 'server'`) |
| Adapter | `@astrojs/vercel` |
| CSS | Tailwind CSS 3 with custom `brand` color palette (blue-based) |
| Font | Inter (Google Fonts, loaded in Layout.astro) |
| Maps | Leaflet 1.9.4 via CDN (NOT npm) — loaded in `<head>` when `leaflet` prop is true |
| Database | Supabase (PostgreSQL with RLS) |
| Auth | Supabase Auth — cookie-based JWT (`sb-session`, 1hr TTL) |
| Storage | Supabase Storage bucket `cvs` (private, signed URLs) |
| Validation | Zod |
| CV Parsing | `pdf-parse` + `mammoth` (for keyword extraction) |
| Node | 22.x |

## Build & Run

```bash
npm run dev      # Local dev server at :4321
npm run build    # Production build (outputs to dist/)
npm run preview  # Preview production build
```

## Environment Variables

```
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # Server-only, bypasses RLS
```

## Project Structure

```
src/
├── layouts/Layout.astro           # Base layout (header, footer, scroll-top, "/" shortcut)
├── middleware.ts                   # Route protection for /empleador/* and /api/ofertas/*
├── lib/
│   ├── supabase.ts                # Public client + createServiceClient()
│   ├── auth.ts                    # Cookie session helpers, getEmpleadorSession()
│   ├── constants.ts               # TIPOS, CATEGORIAS, CATEGORIA_COLORS
│   ├── comunas.ts                 # Chilean comunas with lat/lng coords
│   ├── extract-text.ts            # PDF/DOCX text extraction
│   └── extract-keywords.ts        # Keyword extraction from CV text
├── types/database.ts              # Supabase Database type
├── pages/
│   ├── index.astro                # Homepage: hero + search + category pills + map + card list + load-more
│   ├── oferta/[id].astro          # Offer detail + mini map + drag-drop CV application form
│   ├── privacidad.astro           # Privacy policy page
│   ├── 404.astro                  # Custom 404
│   ├── sitemap.xml.ts             # Dynamic sitemap
│   ├── robots.txt.ts              # robots.txt
│   ├── empleador/
│   │   ├── login.astro            # Employer login
│   │   ├── registro.astro         # Employer registration
│   │   ├── dashboard.astro        # Employer dashboard (list offers, stats, edit/deactivate)
│   │   └── oferta/
│   │       ├── nueva.astro        # Create new offer
│   │       ├── [id]/editar.astro  # Edit existing offer
│   │       └── [id]/postulaciones.astro  # View applications + download CVs
│   └── api/
│       ├── auth/login.ts          # POST: email+password login
│       ├── auth/registro.ts       # POST: register employer
│       ├── auth/logout.ts         # POST: clear session cookie
│       ├── ofertas/nueva.ts       # POST: create offer (authed)
│       ├── ofertas/editar.ts      # POST: edit offer (authed, ownership check)
│       ├── ofertas/desactivar.ts  # POST: deactivate offer (authed)
│       ├── postulaciones.ts       # POST: submit application (public, rate-limited)
│       ├── postulaciones/cv.ts    # GET: signed CV download URL (authed)
│       └── cron/limpiar.ts        # Cleanup old data (90-day retention)
```

## Database Schema (schema.sql)

3 main tables:
- **empleadores** — `id` (UUID, FK to auth.users), `email`, `empresa`, `created_at`
- **ofertas** — `id`, `titulo`, `descripcion`, `empresa`, `tipo_empleo`, `categoria`, `comuna`, `lat`, `lng`, `activa`, `expira_en`, `empleador_id`, `created_at`, `updated_at`
- **postulaciones** — `id`, `oferta_id`, `nombre`, `email`, `cv_url`, `ip_address`, `palabras_clave[]`, `created_at`

RLS policies: public read for active offers, employer-only for mutations and viewing applications, public insert for applications.

Auto-trigger: `updated_at` is auto-set on ofertas UPDATE via `trg_ofertas_updated_at`.

## Authentication Flow

1. Employer registers → Supabase auth.users + empleadores row
2. Login → API sets `sb-session` cookie with JWT (maxAge=3600)
3. Middleware checks cookie on protected routes → redirects to login or returns 401
4. `getEmpleadorSession()` validates token, fetches user+empleador data
5. Service client (`createServiceClient()`) uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for server operations

## Key Architectural Decisions

- **No components directory** — pages are self-contained with inline markup (cards, forms, etc.)
- **Leaflet via CDN** — loaded as `<script>` tag in `<head>`, NOT as npm import; used with `<script define:vars>` blocks
- **Server-side rendering** — all pages render on server; Astro ViewTransitions for SPA-like navigation
- **No client-side framework** — vanilla JS in `<script>` blocks for interactivity
- **Cookie auth** — no localStorage; JWT stored in httpOnly cookie

## CRITICAL Astro Gotchas

### 1. `<script define:vars>` blocks are NOT modules
These are inline scripts where Astro HTML-processes the content. This means:
- **`//` comments become `/`** — always use `/* */` comments instead
- **Arrow functions can cause issues** — prefer `function()` syntax
- **No `import` statements** — Leaflet `L` is available as a global from CDN
- **Use `var` instead of `let`/`const`** for variables in loops (safer in non-module context)

### 2. JSX ternary branches require single expression
In Astro templates, each branch of a ternary `{condition ? (...) : (...)}` must be a single expression. If you need multiple sibling elements in a branch, wrap them in a fragment `<>...</>`:
```astro
{condition ? (
  <div>single element</div>
) : (
  <>
    <div>first element</div>
    <div>second element</div>
  </>
)}
```
Forgetting the fragment causes: `Expected ")" but found "{"` build error.

### 3. Template literals in Astro expressions
Avoid nested template literals in Astro JSX expressions. Pre-compute values in the `.map()` callback body instead:
```astro
{items.map((item, i) => {
  const animDelay = 'animation-delay: ' + (i * 55) + 'ms';  // pre-compute
  return <div style={animDelay}>...</div>;
})}
```

## Implemented Features (as of commit cb28430)

### Core MVP
- [x] Homepage with search bar, type filter, comuna filter, category pills
- [x] Interactive Leaflet map with colored markers by category
- [x] Map marker clustering for overlapping coordinates
- [x] Offer cards with "Nueva" badge, urgency indicators, company initials avatar
- [x] Client-side pagination (load-more button, 20 per page, up to 200 from DB)
- [x] Offer detail page with mini map and full description
- [x] Drag-and-drop CV upload with file preview
- [x] Application form (name, email optional; CV required; privacy consent checkbox)
- [x] Rate limiting: max 3 applications per IP per hour
- [x] CV keyword extraction (pdf-parse + mammoth)
- [x] Privacy policy page (/privacidad) with Chilean law (Ley 19.628)

### Employer Features
- [x] Registration and login with Supabase Auth
- [x] Dashboard with offer list, postulation counts, active/expired status
- [x] Create new offer with comuna → lat/lng auto-conversion
- [x] Edit existing offers
- [x] Deactivate offers
- [x] View applications with keyword badges
- [x] Download CVs via signed URLs
- [x] CSV export of applications
- [x] Read/unread marking for applications

### Technical
- [x] Middleware-based route protection
- [x] Dynamic sitemap with lastmod from updated_at
- [x] robots.txt
- [x] Custom 404 page
- [x] SEO: Open Graph, Twitter Card, canonical URLs
- [x] ViewTransitions for SPA-like navigation
- [x] Scroll-to-top button
- [x] "/" keyboard shortcut to focus search
- [x] Animated counter in hero section
- [x] Card entrance animations (fadeSlideUp)
- [x] 90-day data cleanup cron endpoint

### From SPECIFICATIONS.md Roadmap (Phase 2) — Status
- [x] Editing offers (implemented)
- [x] Category system (implemented — 11 categories with color coding)
- [ ] Geolocation (GPS + radius filter)
- [ ] Full-text search (Meilisearch/Algolia)
- [ ] Email notifications
- [ ] Advanced dashboard analytics
- [ ] Admin moderation panel
- [ ] Batch CV export (zip)
- [ ] LinkedIn integration
- [ ] Dark mode

## Testing

No test framework is set up. Verify changes with `npm run build` (Astro SSR build).

## Commit Style

Use conventional commits: `feat:`, `fix:`, `chore:`. Write in English. Keep first line under 72 chars.
