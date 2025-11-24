# Architecture Overview - Portal de Empleo Chile

Este documento proporciona una visión completa de la arquitectura del Portal de Empleo Chile, diseñado para facilitar la comprensión rápida del sistema y permitir contribuciones efectivas.

**Última actualización**: 2025-11-24

---

## 1. Project Structure

```
mi-portal-de-empleo/
├── src/
│   ├── components/          # Componentes reutilizables de Astro
│   │   ├── ui/             # Componentes básicos de UI
│   │   ├── OfertaCard.astro
│   │   ├── MapaOfertas.astro
│   │   ├── FormularioPostulacion.astro
│   │   └── FiltrosBusqueda.astro
│   ├── layouts/            # Layouts de página
│   │   └── Layout.astro    # Layout base con header/footer
│   ├── pages/              # Páginas y rutas (file-based routing)
│   │   ├── index.astro     # Home page con mapa y ofertas
│   │   ├── oferta/
│   │   │   └── [id].astro  # Detalle de oferta
│   │   ├── empleador/
│   │   │   ├── login.astro
│   │   │   ├── registro.astro
│   │   │   ├── dashboard.astro
│   │   │   └── oferta/
│   │   │       └── nueva.astro
│   │   └── api/            # API routes (serverless functions)
│   │       ├── postular.ts # POST: Crear postulación
│   │       └── ofertas.ts  # GET: Filtrar ofertas
│   ├── lib/                # Lógica de negocio y utilidades
│   │   ├── supabase.ts     # Cliente de Supabase
│   │   ├── comunas.ts      # Datos de comunas con coordenadas
│   │   ├── types/          # Tipos de TypeScript
│   │   │   └── database.ts # Tipos generados desde Supabase
│   │   ├── validations/    # Schemas de validación
│   │   │   └── schemas.ts  # Schemas Zod
│   │   └── utils/          # Funciones auxiliares
│   │       ├── security.ts # Funciones de seguridad
│   │       └── formatting.ts # Formateo de datos
│   ├── core/               # Domain layer (arquitectura hexagonal)
│   │   ├── entities/       # Entidades de dominio
│   │   ├── repositories/   # Interfaces de repositorios
│   │   └── use-cases/      # Casos de uso
│   ├── infrastructure/     # Adaptadores e integraciones
│   │   ├── supabase/       # Implementación de repositorios
│   │   └── storage/        # Gestión de archivos
│   └── styles/
│       └── global.css      # Estilos globales con Tailwind
├── database/
│   └── schema.sql          # Schema completo de PostgreSQL
├── public/                 # Assets estáticos
├── .github/
│   └── workflows/
│       └── ci.yml          # Pipeline de CI/CD
├── astro.config.mjs        # Configuración de Astro
├── tailwind.config.mjs     # Configuración de Tailwind
├── tsconfig.json           # Configuración de TypeScript
└── package.json            # Dependencias y scripts
```

---

## 2. High-Level System Diagram

```
┌─────────────┐
│  Candidato  │
│   (Public)  │
└──────┬──────┘
       │
       │ HTTP/HTTPS
       ↓
┌─────────────────────────────────────────────┐
│         Frontend (Astro + Vercel)           │
│  ┌────────────┐  ┌──────────────────────┐  │
│  │   Pages    │  │   API Routes         │  │
│  │  (SSR/SSG) │  │  (Serverless Funcs)  │  │
│  └────────────┘  └──────────────────────┘  │
└──────────┬──────────────────┬───────────────┘
           │                  │
           │                  │ Supabase Client SDK
           ↓                  ↓
    ┌──────────────────────────────────────┐
    │      Supabase (Backend as a Service) │
    │  ┌────────────┐  ┌────────────────┐  │
    │  │ PostgreSQL │  │  Auth Service  │  │
    │  │  + PostGIS │  │   (JWT/OAuth)  │  │
    │  └────────────┘  └────────────────┘  │
    │  ┌────────────┐  ┌────────────────┐  │
    │  │  Storage   │  │  Row Level     │  │
    │  │  (S3-like) │  │  Security (RLS)│  │
    │  └────────────┘  └────────────────┘  │
    └──────────────────────────────────────┘
           ↑
           │
    ┌──────┴──────┐
    │  Empleador  │
    │ (Autenticado)│
    └─────────────┘

External Services:
- OpenStreetMap (tiles para Leaflet)
- Vercel CDN (static assets)
```

**Flujo de Datos**:

1. **Candidato busca ofertas**:
   - Browser → Vercel → `/` (SSG con ofertas públicas)
   - Cliente JS → Leaflet → OpenStreetMap (tiles)
   - Usuario filtra → `/api/ofertas` → Supabase → PostgreSQL

2. **Candidato postula**:
   - Browser → `/api/postular` (POST)
   - Validación + Rate Limiting (in-memory)
   - Upload CV → Supabase Storage
   - Crear registro → PostgreSQL (con IP hasheada)

3. **Empleador crea oferta**:
   - Browser → Login → Supabase Auth
   - Dashboard → `/empleador/dashboard` (SSR con RLS)
   - Nueva oferta → `/api/ofertas` → PostgreSQL (RLS policy valida ownership)

---

## 3. Core Components

### 3.1. Frontend Application

**Name**: Portal de Empleo Web App

**Description**: Aplicación web server-side rendered (SSR) con Astro que permite a candidatos buscar empleos georeferenciados sin registro, y a empleadores gestionar ofertas tras autenticarse.

**Technologies**:
- **Astro 4.x**: Framework SSR/SSG con file-based routing
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Tipado estático
- **Leaflet 1.9+**: Librería de mapas interactivos
- **Zod**: Validación de schemas

**Key Features**:
- Server-Side Rendering (SSR) para SEO
- Static Site Generation (SSG) para páginas públicas
- API Routes como serverless functions
- Hybrid rendering (SSR + SSG en la misma app)

**Deployment**: Vercel Edge Network

**Performance Goals**:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

### 3.2. Backend Services

#### 3.2.1. Supabase (Backend as a Service)

**Name**: Supabase Cloud

**Description**: Backend completo que proporciona base de datos PostgreSQL con extensiones PostGIS, autenticación, storage de archivos y Row Level Security.

**Technologies**:
- PostgreSQL 15+ con PostGIS
- Supabase Auth (JWT-based)
- Supabase Storage (S3-compatible)
- Realtime (WebSockets, no usado en MVP)

**Key Services**:

1. **PostgreSQL Database**:
   - Tablas: `empleadores`, `ofertas`, `postulaciones`
   - Extensiones: PostGIS (geolocalización), pg_trgm (búsqueda full-text)
   - Índices espaciales GIST para consultas geográficas
   - Triggers para auto-desactivar ofertas expiradas

2. **Authentication**:
   - Email + Password (bcrypt)
   - JWT tokens con expiración
   - Row Level Security integrado

3. **Storage**:
   - Bucket `cvs` para almacenar CVs
   - Límite de 5MB por archivo
   - MIME types: PDF, DOC, DOCX
   - Políticas de acceso: solo empleador propietario puede descargar

**Deployment**: Supabase Cloud (managed)

#### 3.2.2. API Routes (Serverless Functions)

**Name**: Astro API Routes

**Description**: Endpoints serverless que manejan la lógica de negocio sensible (postulaciones, uploads).

**Technologies**: Node.js (runtime de Vercel)

**Key Endpoints**:

- `POST /api/postular`: Crear postulación con validación de archivos
- `GET /api/ofertas`: Filtrar ofertas públicas
- `POST /api/ofertas` (futuro): Crear oferta (empleador autenticado)

**Security Features**:
- Rate limiting multi-capa (IP, email, global)
- Validación de magic numbers (archivos)
- Sanitización de inputs (DOMPurify + Zod)
- IP hashing (SHA-256)

---

## 4. Data Stores

### 4.1. PostgreSQL con PostGIS

**Name**: Base de Datos Principal

**Type**: PostgreSQL 15+ con PostGIS extension

**Purpose**: Almacenar ofertas, postulaciones y perfiles de empleadores con soporte geoespacial.

**Key Schemas**:

```sql
empleadores (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  nombre_empresa TEXT,
  created_at TIMESTAMP
)

ofertas (
  id UUID PRIMARY KEY,
  empleador_id UUID REFERENCES empleadores,
  titulo TEXT,
  descripcion TEXT,
  empresa TEXT,
  tipo_jornada TEXT CHECK(...),
  categoria TEXT,
  comuna TEXT,
  ubicacion GEOGRAPHY(POINT, 4326), -- PostGIS
  activa BOOLEAN,
  expires_at TIMESTAMP
)

postulaciones (
  id UUID PRIMARY KEY,
  oferta_id UUID REFERENCES ofertas,
  nombre_candidato TEXT,
  email_candidato TEXT,
  cv_url TEXT,
  ip_hash TEXT, -- SHA-256 de la IP
  created_at TIMESTAMP
)
```

**Indexes**:
- Índices espaciales GIST en `ofertas.ubicacion`
- Índices compuestos para búsqueda (`activa`, `categoria`, `tipo_jornada`)
- Índices GIN para full-text search con pg_trgm

**Security**:
- Row Level Security (RLS) habilitado en todas las tablas
- Políticas granulares por rol (anon, authenticated)

### 4.2. Supabase Storage

**Name**: Almacenamiento de CVs

**Type**: S3-compatible object storage

**Purpose**: Almacenar archivos CV subidos por candidatos de forma segura.

**Bucket Configuration**:
- Nombre: `cvs`
- Público: No (acceso solo via signed URLs)
- Límite de tamaño: 5MB
- Tipos permitidos: PDF, DOC, DOCX
- Retención: 90 días (limpieza automática via cron)

---

## 5. External Integrations / APIs

### 5.1. OpenStreetMap

**Purpose**: Proveer tiles (imágenes de mapa) para Leaflet

**Integration Method**: HTTP requests desde el cliente
- URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Licencia: Open Database License
- No requiere API key

### 5.2. Vercel Analytics (Opcional)

**Purpose**: Métricas de Core Web Vitals y performance

**Integration Method**: SDK embebido en el cliente

---

## 6. Deployment & Infrastructure

**Cloud Provider**: Vercel (frontend) + Supabase Cloud (backend)

**Key Services Used**:
- **Vercel Edge Network**: CDN global con 100+ ubicaciones
- **Vercel Serverless Functions**: Node.js runtime para API routes
- **Supabase**: Managed PostgreSQL + Auth + Storage

**CI/CD Pipeline**: GitHub Actions

**Workflow**:
1. Push a `main` → GitHub Actions
2. Lint + Type Check
3. Run Tests
4. Security Audit (npm audit + Trivy)
5. Build
6. Deploy to Vercel Production

**Environments**:
- **Production**: `main` branch → vercel.com
- **Preview**: Pull Requests → vercel.app (URLs únicas por PR)
- **Development**: Local (`npm run dev`)

**Monitoring & Logging**:
- Vercel Logs (stdout/stderr de functions)
- Supabase Logs (queries SQL, auth events)
- Vercel Analytics (Core Web Vitals)
- *Futuro*: Sentry para error tracking

---

## 7. Security Considerations

### Authentication

- **Empleadores**: Email + Password via Supabase Auth
  - Bcrypt para hashing de passwords
  - JWT tokens con expiración de 1 hora
  - Refresh tokens para renovación automática

- **Candidatos**: Sin autenticación (postulación anónima)

### Authorization

- **Row Level Security (RLS)** en PostgreSQL:
  - Candidatos: Pueden ver ofertas activas (SELECT)
  - Empleadores: Pueden ver/editar solo sus ofertas (WHERE empleador_id = auth.uid())
  - Empleadores: Pueden ver postulaciones solo de sus ofertas

### Data Encryption

- **En tránsito**: TLS 1.3 obligatorio (Vercel + Supabase)
- **En reposo**: AES-256 (managed by Supabase)
- **IPs**: Hasheadas con SHA-256 + salt antes de almacenar

### Key Security Practices

- Validación de archivos por magic numbers (no solo MIME type)
- Rate limiting multi-capa (IP, email, oferta)
- Input sanitization (DOMPurify)
- Security headers (CSP, X-Frame-Options, etc.)
- Regular dependency audits (Dependabot)
- No almacenamiento de IPs directas (solo hash)

### OWASP Top 10 Mitigations

| Vulnerabilidad | Mitigación |
|----------------|------------|
| Injection | Supabase SQL queries (prepared statements) |
| Broken Auth | Supabase Auth con bcrypt + JWT |
| Sensitive Data Exposure | TLS + IP hashing + RLS policies |
| XXE | N/A (no XML parsing) |
| Broken Access Control | RLS policies granulares |
| Security Misconfiguration | Headers de seguridad + environment vars |
| XSS | DOMPurify + CSP headers |
| Insecure Deserialization | JSON only (nativo en JS) |
| Known Vulnerabilities | npm audit + Dependabot |
| Insufficient Logging | Vercel + Supabase logs |

---

## 8. Development & Testing Environment

### Local Setup

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para instrucciones detalladas.

**Quick Start**:
```bash
npm install
cp .env.example .env
# Configurar variables en .env
npm run dev
```

### Testing Frameworks

- **Unit Tests**: Vitest
- **Integration Tests**: Vitest + Supabase test client
- **E2E Tests**: *Futuro* (Playwright)

### Code Quality Tools

- **Linter**: ESLint + eslint-plugin-astro
- **Formatter**: Prettier + prettier-plugin-astro
- **Type Checker**: TypeScript strict mode
- **Pre-commit**: *Futuro* (Husky + lint-staged)

### Database Migrations

Actualmente manual via SQL scripts en `database/`.

*Futuro*: Migración a herramientas como Prisma o Supabase Migrations CLI.

---

## 9. Future Considerations / Roadmap

### Technical Debt

1. **Rate Limiting**: Actualmente en memoria (no escala horizontalmente)
   - **Solución**: Migrar a Redis o Upstash

2. **File Validation**: Solo valida magic numbers básicos
   - **Solución**: Integrar ClamAV o VirusTotal API

3. **Search**: Búsqueda básica con ILIKE
   - **Solución**: Implementar Meilisearch o Algolia

### Planned Features (Fase 2)

1. **Geolocalización del usuario**: GPS + filtro por radio de distancia
2. **Emails automáticos**: Confirmación de postulación (Resend/SendGrid)
3. **Dashboard avanzado**: Estadísticas con gráficos (Chart.js)
4. **Edición de ofertas**: PATCH endpoint con validación
5. **Sistema de notificaciones**: WebSockets (Supabase Realtime)
6. **PWA**: Service Worker + offline support
7. **Internacionalización**: i18n para inglés

### Architectural Changes

- **Event-Driven Architecture**: Para notificaciones en tiempo real
- **Microservices**: Si escala > 10,000 usuarios (poco probable en MVP)
- **Edge Computing**: Mover rate limiting a Cloudflare Workers

---

## 10. Project Identification

**Project Name**: Portal de Empleo Chile

**Repository URL**: https://github.com/datanalytics86/mi-portal-de-empleo

**Primary Contact/Team**: DataAnalytics86

**Date of Last Update**: 2025-11-24

**Version**: 1.0.0-alpha

**License**: MIT

---

## 11. Glossary / Acronyms

| Término | Definición |
|---------|------------|
| **RLS** | Row Level Security - Sistema de PostgreSQL para controlar acceso a filas |
| **SSR** | Server-Side Rendering - Renderizado en el servidor |
| **SSG** | Static Site Generation - Generación de sitios estáticos |
| **PostGIS** | Extensión de PostgreSQL para datos geoespaciales |
| **JWT** | JSON Web Token - Estándar para tokens de autenticación |
| **CSP** | Content Security Policy - Header de seguridad |
| **GIST** | Generalized Search Tree - Tipo de índice para datos espaciales |
| **Magic Numbers** | Primeros bytes de un archivo que identifican su tipo real |
| **Rate Limiting** | Técnica para limitar cantidad de requests por tiempo |
| **DOMPurify** | Librería para sanitizar HTML y prevenir XSS |

---

## 12. Performance Benchmarks

### Targets (Lighthouse)

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 95

### Current Metrics (Estimado)

| Métrica | Target | Actual (TBD) |
|---------|--------|--------------|
| LCP | < 2.5s | TBD |
| FID | < 100ms | TBD |
| CLS | < 0.1 | TBD |
| TTFB | < 600ms | TBD |

---

## 13. Scaling Considerations

### Current Capacity (Estimado)

- **Concurrent Users**: ~1,000
- **API Requests/min**: ~500 (rate limiting global)
- **Database**: Supabase Free Tier (500MB, 2GB transfer)
- **Storage**: Supabase Free Tier (1GB)

### Bottlenecks Potenciales

1. **Supabase Free Tier**: Límite de conexiones concurrentes (60)
2. **Rate Limiting In-Memory**: No funciona con múltiples instancias de Vercel
3. **Búsqueda Full-Text**: ILIKE no escala > 100,000 ofertas

### Scaling Strategy

- **< 10,000 usuarios**: Mantener arquitectura actual
- **10,000 - 50,000**: Upgrade a Supabase Pro + Redis para rate limiting
- **> 50,000**: Evaluar microservicios + CDN dedicado

---

**Fin del documento**

Este documento debe actualizarse con cada cambio arquitectónico significativo.
