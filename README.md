# mi-portal-de-empleo

Portal de reclutamiento **minimalista** para Chile.

Candidatos postulan **sin registro** (solo suben su CV). Empleadores publican ofertas georeferenciadas y reciben postulaciones con **palabras clave y resumen extraídos automáticamente** del CV.

| | |
|---|---|
| **Demo** | [mi-portal-de-empleo.vercel.app](https://mi-portal-de-empleo.vercel.app) |
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
- **Rate limiting** — máx. 3 postulaciones por IP por hora.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend / API | Astro 5 (SSR), TypeScript, Tailwind CSS |
| Mapa | Leaflet + OpenStreetMap |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| CV parse | `pdf-parse`, `mammoth`, Zod; OCR (`tesseract` / OCR.space); LLM opcional (xAI Grok) |
| Deploy | Vercel (+ Edge Function opcional `parse-cv`) |

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
```

**Opcionales (mejor calidad de parsing)**

```env
XAI_API_KEY=              # structured parse con Grok
XAI_MODEL=grok-3-mini
OCR_SPACE_API_KEY=        # OCR cloud para PDFs escaneados (recomendado en Vercel)
CV_OCR_ENABLED=true
CV_OCR_MAX_PAGES=3
```

Ver `.env.example` completo.

### Base de datos

1. **Proyecto nuevo:** ejecutar `schema.sql` en Supabase → SQL Editor.  
2. **Proyecto existente (solo columnas de parse):** ejecutar `scripts/migration-cv-parse.sql`.  
3. Crear bucket Storage `cvs` (privado) si no existe (también en `schema.sql`).

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

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |

---

## Estructura relevante

```
src/
  lib/cv-parser/          # Orquestador + extractores + keywords + OCR + match
  pages/api/postulaciones.ts
  pages/empleador/oferta/[id]/postulaciones.astro
  pages/oferta/[id].astro
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
