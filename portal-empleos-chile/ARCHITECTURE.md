# Architecture Overview - Portal de Empleos Chile

This document serves as a comprehensive guide to understanding the codebase architecture. It is designed to help developers quickly navigate the project, understand design decisions, and contribute effectively.

**Project Status:** ✅ MVP Complete (Pasos 1-6 implemented)
**Total Lines of Code:** ~6,780 lines
**Stack:** Astro 5.x (SSR) + Supabase + Tailwind CSS + Leaflet

---

## 1. Project Structure

The project follows Astro's file-based routing convention with SSR (Server-Side Rendering) enabled.

```
portal-empleos-chile/
├── public/                          # Static assets (favicon, etc.)
├── src/
│   ├── components/                  # Reusable Astro components
│   │   ├── FormularioPostulacion.astro  # CV upload form (484 lines)
│   │   ├── MapaOfertas.astro            # Leaflet map component (130 lines)
│   │   └── OfertaCard.astro             # Job card component (109 lines)
│   │
│   ├── layouts/
│   │   └── Layout.astro             # Base layout with header/footer (166 lines)
│   │
│   ├── pages/                       # File-based routing
│   │   ├── index.astro              # Home page with map + job list (259 lines)
│   │   ├── privacidad.astro         # Privacy policy (309 lines)
│   │   │
│   │   ├── oferta/
│   │   │   └── [id].astro           # Job detail + application form (301 lines)
│   │   │
│   │   ├── empleador/               # Employer-only pages (protected)
│   │   │   ├── login.astro          # Login page (219 lines)
│   │   │   ├── registro.astro       # Registration page (301 lines)
│   │   │   ├── dashboard.astro      # Dashboard with job table (327 lines)
│   │   │   └── oferta/
│   │   │       ├── nueva.astro      # Create job form (390 lines)
│   │   │       └── [id]/postulaciones.astro # View applications (304 lines)
│   │   │
│   │   └── api/                     # API endpoints (SSR)
│   │       ├── postular.ts          # Submit application (282 lines)
│   │       ├── auth/
│   │       │   ├── login.ts         # Login endpoint (96 lines)
│   │       │   ├── registro.ts      # Registration endpoint (121 lines)
│   │       │   └── logout.ts        # Logout endpoint (40 lines)
│   │       └── ofertas/
│   │           ├── crear.ts         # Create job endpoint (127 lines)
│   │           └── [id]/
│   │               ├── toggle.ts    # Toggle job active status (78 lines)
│   │               └── cv-download.ts # Generate signed CV URL (98 lines)
│   │
│   ├── lib/                         # Utility libraries and configurations
│   │   ├── supabase.ts              # Supabase client config (159 lines)
│   │   ├── auth.ts                  # Auth helpers and session management (122 lines)
│   │   ├── comunas.ts               # 150+ Chilean communes with coordinates (214 lines)
│   │   └── validations.ts           # Zod schemas and validation functions (253 lines)
│   │
│   ├── styles/
│   │   └── global.css               # Global styles + Tailwind imports
│   │
│   └── middleware.ts                # Route protection middleware (29 lines)
│
├── astro.config.mjs                 # Astro configuration (SSR + Node adapter)
├── tailwind.config.mjs              # Tailwind custom config
├── tsconfig.json                    # TypeScript strict mode
├── package.json                     # Dependencies and scripts
├── supabase-schema.sql              # Database setup script (340 lines)
├── SUPABASE_SETUP.md                # Supabase configuration guide (290 lines)
├── SPECIFICATIONS.md                # Complete project specifications (18,720 bytes)
├── README.md                        # Setup and deployment guide
├── vercel.json                      # Vercel deployment config
└── .env.example                     # Environment variables template
```

---

## 2. High-Level System Architecture

### System Context Diagram

```
┌─────────────┐
│  Candidato  │ (No registration required)
└──────┬──────┘
       │
       │ Browse jobs, view map, submit CV
       ↓
┌─────────────────────────────────────────┐
│  Portal de Empleos (Astro SSR)          │
│  ┌────────────┐  ┌──────────────────┐   │
│  │  Public    │  │  Employer        │   │
│  │  Pages     │  │  Dashboard       │   │
│  │  (Static)  │  │  (Protected)     │   │
│  └────────────┘  └──────────────────┘   │
│         │                 │              │
│         └────────┬────────┘              │
│                  ↓                       │
│      ┌──────────────────────┐           │
│      │  API Endpoints (SSR)  │          │
│      └──────────────────────┘           │
└───────────────┬─────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────┐
│  Supabase Backend                         │
│  ┌────────────┐  ┌──────────┐  ┌───────┐ │
│  │ PostgreSQL │  │ Storage  │  │ Auth  │ │
│  │ + PostGIS  │  │ (CVs)    │  │       │ │
│  └────────────┘  └──────────┘  └───────┘ │
└───────────────────────────────────────────┘
       ↑
       │
┌──────┴───────┐
│  Empleador   │ (Requires authentication)
└──────────────┘
```

### Data Flow

**Candidate Application Flow:**
1. User browses jobs on home page (SSR pre-rendered)
2. Map fetches job coordinates from Supabase
3. User clicks job → navigates to detail page
4. User uploads CV → validates client-side (Zod)
5. CV uploads to Supabase Storage (`cvs` bucket)
6. Application record created in `postulaciones` table
7. Rate limiting enforced (3 per hour per IP)

**Employer Job Management Flow:**
1. Employer registers/logs in → Supabase Auth
2. Session stored in HTTP-only cookies
3. Middleware protects `/empleador/*` routes
4. Dashboard fetches jobs with aggregated application counts
5. Create job → validates → converts comuna to PostGIS POINT
6. View applications → generates signed URLs for CV download

---

## 3. Core Components

### 3.1. Frontend (Astro Components)

**Technology:** Astro 5.x with TypeScript strict mode

**Key Components:**

- **`Layout.astro`**: Base layout with responsive header, navigation, and 3-column footer. Includes Leaflet CSS import.

- **`MapaOfertas.astro`**: Interactive map using Leaflet. Renders markers for each job offer with popup details. Handles icon path fixes for production.

- **`OfertaCard.astro`**: Job listing card with title, company, location, job type badge, and relative date.

- **`FormularioPostulacion.astro`**: Complete application form with:
  - Drag & drop CV upload
  - Real-time validation (file type, size)
  - Privacy policy checkbox
  - Four states: default, loading, success, error

### 3.2. Backend (API Endpoints)

**Technology:** Astro API routes with SSR (Node.js adapter)

**Authentication:**
- **`/api/auth/login.ts`**: Validates credentials, creates session cookies
- **`/api/auth/registro.ts`**: Creates user in Auth + empleadores table (transactional)
- **`/api/auth/logout.ts`**: Clears session cookies

**Job Management:**
- **`/api/ofertas/crear.ts`**: Creates job with PostGIS point, validates all fields
- **`/api/ofertas/[id]/toggle.ts`**: Activates/deactivates job
- **`/api/ofertas/[id]/cv-download.ts`**: Generates signed URL (1-hour expiry) for CV download

**Applications:**
- **`/api/postular.ts`**: Handles CV upload to Storage, creates application record, enforces rate limiting

### 3.3. Database (Supabase/PostgreSQL)

**Technology:** PostgreSQL 15+ with PostGIS extension

**Schema:**

```sql
-- Employers
empleadores (
  id UUID PK,
  email TEXT UNIQUE,
  nombre_empresa TEXT,
  created_at TIMESTAMP
)

-- Job Offers
ofertas (
  id UUID PK,
  empleador_id UUID FK → empleadores(id),
  titulo TEXT,
  descripcion TEXT,
  empresa TEXT,
  tipo_jornada TEXT, -- ENUM: Full-time, Part-time, Freelance, Práctica
  categoria TEXT,
  comuna TEXT,
  ubicacion GEOGRAPHY(POINT, 4326), -- PostGIS
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
)

-- Applications
postulaciones (
  id UUID PK,
  oferta_id UUID FK → ofertas(id),
  nombre_candidato TEXT NULL,
  email_candidato TEXT NULL,
  cv_url TEXT, -- Path in Supabase Storage
  ip_address TEXT, -- For rate limiting
  created_at TIMESTAMP
)
```

**Indexes:**
- `idx_ofertas_ubicacion` (GIST index on `ubicacion`) for spatial queries
- `idx_ofertas_activa` (B-tree on `activa`) for filtering
- `idx_postulaciones_oferta_id` (B-tree on `oferta_id`) for joins

**Row Level Security (RLS):**
- Ofertas: Public read (activa = TRUE), owner-only write
- Postulaciones: Owner-only read (via oferta_id → empleador_id)
- Storage CVs: Owner-only download (verified via postulaciones chain)

### 3.4. Storage (Supabase Storage)

**Bucket:** `cvs` (private)

**Structure:** `{oferta_id}/{timestamp}_{uuid}_{filename}.ext`

**Security:**
- No public access
- Download requires signed URL generated by employer-only endpoint
- Triple verification: employer → job → application → CV

### 3.5. Authentication & Authorization

**Technology:** Supabase Auth + custom session management

**Implementation:**
- Sessions stored in HTTP-only cookies (`sb-access-token`, `sb-refresh-token`)
- Middleware (`src/middleware.ts`) protects `/empleador/*` routes
- Helper functions in `src/lib/auth.ts`:
  - `getSession()`: Restores session from cookies
  - `isAuthenticated()`: Checks authentication status
  - `getEmpleadorProfile()`: Fetches employer data

### 3.6. Utilities & Libraries

**`src/lib/comunas.ts`:**
- 150+ Chilean communes with lat/lng coordinates
- Helper functions: `findComuna()`, `getComunasByRegion()`, `getRegiones()`
- Used for geocoding and form dropdowns

**`src/lib/validations.ts`:**
- Zod schemas for type-safe validation
- Constants: `MAX_CV_SIZE`, `ALLOWED_CV_TYPES`, `MAX_POSTULATIONS_PER_HOUR`
- Validation functions: `validateCVFile()`, `isValidEmail()`, `isValidPassword()`

---

## 4. Key Design Decisions

### 4.1. SSR vs. Static

**Decision:** Use SSR (Server-Side Rendering) mode with `output: 'server'`

**Rationale:**
- Authentication requires server-side session management
- Dynamic routes (`/empleador/dashboard`, `/oferta/[id]`) fetch user-specific data
- Middleware can protect routes at request time
- Public pages (`/`, `/privacidad`) are pre-rendered with `export const prerender = true`

**Trade-offs:**
- Requires Node.js server (not pure static hosting)
- Slightly higher hosting complexity vs. static sites
- Better security and flexibility for authenticated features

### 4.2. No Separate Backend

**Decision:** Use Astro API routes instead of separate backend server

**Rationale:**
- Simpler architecture (single codebase)
- Easier deployment (one service)
- Astro API routes support full SSR capabilities
- Supabase handles complex backend logic (auth, storage, RLS)

**Trade-offs:**
- Not ideal for highly complex backend logic
- Good fit for CRUD operations and simple workflows

### 4.3. PostGIS for Geolocation

**Decision:** Use PostgreSQL PostGIS extension for geographic queries

**Rationale:**
- Native support for spatial queries (distance, bounding box)
- GEOGRAPHY type handles lat/lng correctly
- GIST indexes for efficient spatial searches
- Future-proof for features like "jobs within X km"

**Implementation:**
```sql
ubicacion GEOGRAPHY(POINT, 4326) -- WGS 84
```

Queries:
```sql
-- Find jobs within 10km of a point
SELECT * FROM ofertas
WHERE ST_DWithin(ubicacion, ST_GeogFromText('POINT(-70.6693 -33.4489)'), 10000);
```

### 4.4. Rate Limiting

**Decision:** IP-based rate limiting (3 applications/hour)

**Implementation:** Query `postulaciones` table for recent applications from same IP

**Rationale:**
- Prevents spam without requiring user authentication
- Simple implementation (no external service)
- Effective for MVP

**Limitations:**
- Shared IPs (NAT) may affect legitimate users
- Can be bypassed with VPN/proxy (acceptable for MVP)

### 4.5. CV Storage Strategy

**Decision:** Store CVs in Supabase Storage with signed URLs

**Rationale:**
- Secure: No public access, requires signed URL
- Scalable: Supabase handles storage infrastructure
- Cost-effective: Free tier includes 1GB storage
- Automatic cleanup possible (90-day retention policy)

**Alternative Considered:** Store CVs as base64 in database
**Rejected:** Large blobs in DB affect performance, harder to manage

### 4.6. No CV Preview/Rendering

**Decision:** Employers download CVs to view (no in-app preview)

**Rationale:**
- Simpler implementation (no PDF.js or similar)
- Better UX for reviewing multiple CVs (use local PDF reader)
- Reduces browser memory usage
- MVP scope (can add preview in Phase 2)

---

## 5. Security Considerations

### 5.1. Authentication

- ✅ HTTP-only cookies (prevent XSS)
- ✅ Secure flag in production (HTTPS only)
- ✅ SameSite: Lax (CSRF protection)
- ✅ Session validation on every protected route

### 5.2. Authorization

- ✅ Middleware protects `/empleador/*` routes
- ✅ API endpoints verify session + ownership
- ✅ Triple verification for CV download:
  1. Employer authenticated
  2. Job belongs to employer
  3. Application belongs to job
  4. CV belongs to application

### 5.3. Input Validation

- ✅ Client-side validation (Zod)
- ✅ Server-side validation (all API endpoints)
- ✅ File type validation (PDF, DOC, DOCX)
- ✅ File size limit (5MB)
- ✅ SQL injection prevented (Supabase client uses parameterized queries)

### 5.4. Rate Limiting

- ✅ 3 applications per hour per IP
- ⚠️ Can be bypassed (acceptable for MVP)
- 🔄 Future: Use Redis/Upstash for distributed rate limiting

### 5.5. Data Privacy

- ✅ Row Level Security (RLS) on all tables
- ✅ Privacy policy page (`/privacidad`)
- ✅ Optional candidate data (name, email)
- ✅ 90-day retention policy stated
- ⚠️ No automated cleanup implemented (manual or cron job needed)

---

## 6. Performance Optimizations

### 6.1. Implemented

- ✅ SSR pre-renders public pages
- ✅ Tailwind CSS purging (production builds)
- ✅ Leaflet CDN (no bundle bloat)
- ✅ PostGIS spatial indexes (GIST)
- ✅ Database indexes on frequently queried columns

### 6.2. Future Optimizations

- [ ] Image optimization (if images added)
- [ ] CDN for static assets
- [ ] Database query caching (Redis)
- [ ] Lazy loading for map markers (pagination)
- [ ] Service worker for offline support

---

## 7. Deployment Architecture

### 7.1. Recommended Stack

**Option 1: Vercel + Supabase (Easiest)**
- Frontend + API: Vercel (auto-detects Astro)
- Database + Storage + Auth: Supabase Cloud
- Total cost: $0 (free tiers)

**Option 2: Railway + Supabase**
- Frontend + API: Railway
- Database + Storage + Auth: Supabase Cloud
- Total cost: $0 (free tiers)

**Option 3: VPS (Most Control)**
- Everything on VPS (Node.js + PostgreSQL + Storage)
- Example: DigitalOcean Droplet ($6/month)
- Requires: PM2, Nginx, Let's Encrypt

### 7.2. Environment Variables

Required in production:
```
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PUBLIC_SITE_URL=https://yourdomain.com
```

### 7.3. Build Command

```bash
npm run build
# Output: dist/server/entry.mjs + dist/client/*
```

---

## 8. Testing Strategy

### 8.1. Current State

**Manual Testing:**
- ✅ TypeScript compilation (0 errors)
- ✅ Build succeeds
- ✅ All routes tested manually

### 8.2. Recommended Testing (Phase 2)

**Unit Tests (Vitest):**
- Validation functions (`lib/validations.ts`)
- Auth helpers (`lib/auth.ts`)
- Utility functions (`lib/comunas.ts`)

**Integration Tests (Playwright):**
- Candidate flow: Browse → View job → Submit application
- Employer flow: Register → Login → Create job → View applications

**E2E Tests:**
- Critical user paths
- Cross-browser testing (Chrome, Safari, Firefox)

---

## 9. Monitoring & Observability

### 9.1. Current State

**Logging:**
- Console logs in API endpoints
- Supabase built-in logging

### 9.2. Recommended (Phase 2)

**Application Monitoring:**
- Sentry (error tracking)
- LogRocket (session replay)
- Vercel Analytics (if using Vercel)

**Database Monitoring:**
- Supabase Dashboard (built-in metrics)
- Slow query logs
- Connection pool monitoring

**Alerts:**
- Error rate spikes
- Storage quota warnings
- Database connection failures

---

## 10. Known Limitations & Future Work

### 10.1. Current Limitations

1. **No CV Preview** - Employers must download to view
2. **No Job Editing** - Can only activate/deactivate
3. **No Email Notifications** - No confirmation emails
4. **Manual CV Cleanup** - No automated 90-day deletion
5. **Basic Search** - No full-text search or fuzzy matching
6. **No Admin Panel** - No moderation tools

### 10.2. Roadmap (Post-MVP)

**Phase 2 (High Priority):**
- [ ] Job editing functionality
- [ ] Email notifications (SendGrid/Resend)
- [ ] Automated CV cleanup (cron job)
- [ ] Full-text search (Meilisearch)
- [ ] GPS-based "jobs near me" feature

**Phase 3 (Nice to Have):**
- [ ] Admin panel for moderation
- [ ] Analytics dashboard for employers
- [ ] Bulk CV export (ZIP)
- [ ] LinkedIn integration
- [ ] Mobile app (React Native)

---

## 11. Contributing Guidelines

### 11.1. Code Style

- TypeScript strict mode
- ESLint + Prettier (configure if needed)
- Astro component naming: PascalCase
- API route naming: kebab-case

### 11.2. Commit Messages

Follow conventional commits:
```
feat: Add job editing functionality
fix: Correct CV download permissions
docs: Update README deployment section
```

### 11.3. Pull Request Process

1. Create feature branch from `main`
2. Implement feature with tests
3. Ensure `npm run build` passes
4. Update ARCHITECTURE.md if needed
5. Submit PR with description

---

## 12. Glossary

- **Candidato**: Job seeker (no registration)
- **Empleador**: Employer (requires registration)
- **Oferta**: Job posting/offer
- **Postulación**: Job application
- **Comuna**: Chilean administrative division (similar to municipality)
- **RLS**: Row Level Security (Supabase feature)
- **PostGIS**: PostgreSQL extension for geographic data
- **SSR**: Server-Side Rendering

---

## 13. Contact & Support

**Documentation:**
- SPECIFICATIONS.md - Complete requirements
- README.md - Setup & deployment guide
- SUPABASE_SETUP.md - Database configuration

**Architecture Decisions:**
- All major decisions documented in this file
- For questions, refer to SPECIFICATIONS.md first

---

**Last Updated:** 2025-10-31
**Architecture Version:** 1.0 (MVP Complete)
**Total Implementation:** 6,780 lines across 6 implementation phases
