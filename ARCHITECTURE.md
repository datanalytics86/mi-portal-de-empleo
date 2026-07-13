# Architecture — mi-portal-de-empleo

Portal de reclutamiento minimalista para Chile.

| | |
|---|---|
| **Stack** | Astro 5 + TypeScript + Tailwind · Supabase (Postgres + Storage + Auth) · Vercel |
| **Repo** | https://github.com/datanalytics86/mi-portal-de-empleo |
| **Última actualización** | 2026-07-13 — CV parsing Tier 1 (docs + pipeline async) |

---

## 1. Principios

1. **Zero-friction:** el candidato no se registra; solo sube CV.
2. **Fail-open en parse:** fallar al analizar el CV **nunca** revierte la postulación.
3. **Respuesta rápida:** el HTTP 200 se devuelve tras upload + INSERT; el parse corre en background (`waitUntil`).
4. **Minimalismo:** sin ATS pesado; keywords + resumen + match % bastan para priorizar.
5. **Español Chile first:** acentos, ñ, teléfonos +56, skills locales.

---

## 2. Estructura del repositorio

```
/
├── src/
│   ├── lib/
│   │   ├── cv-parser/                 # ★ Pipeline de parsing de CVs
│   │   │   ├── index.ts               # parseCv() — orquestador
│   │   │   ├── types.ts               # Zod: CvParsed, ParseStatus
│   │   │   ├── file-validation.ts     # MIME + magic bytes + 5 MB
│   │   │   ├── extract-text.ts        # PDF (pdf-parse) / DOCX (mammoth) + OCR fallback
│   │   │   ├── ocr.ts                 # OCR.space y/o tesseract + pdfjs
│   │   │   ├── rule-parser.ts         # Extracción estructurada rule-based
│   │   │   ├── llm-parser.ts          # xAI Grok (opcional)
│   │   │   ├── keywords.ts            # Catálogo + frecuencia
│   │   │   ├── skills-chile.ts        # Skills / soft skills / ubicaciones CL
│   │   │   └── match-score.ts         # Score heurístico 0–100
│   │   ├── extract-text.ts            # Re-export (compat)
│   │   ├── extract-keywords.ts        # Re-export (compat)
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   ├── comunas.ts
│   │   └── constants.ts
│   ├── pages/
│   │   ├── api/
│   │   │   ├── postulaciones.ts       # POST: upload + insert + parse async
│   │   │   ├── postulaciones/cv.ts    # Descarga firmada del CV
│   │   │   └── cron/limpiar.ts        # Limpieza / expiración
│   │   ├── oferta/[id].astro          # Detalle + form postulación (dropzone)
│   │   └── empleador/oferta/[id]/postulaciones.astro
│   ├── layouts/Layout.astro           # OG / meta
│   └── types/database.ts
├── supabase/functions/parse-cv/       # Edge: reintento de parse
├── scripts/migration-cv-parse.sql
├── schema.sql
├── DEPLOY-CV-PARSE.md
├── SPECIFICATIONS.md
└── README.md
```

---

## 3. Diagrama de alto nivel

```
┌────────────┐  multipart CV   ┌─────────────────────────────────┐
│  Candidato │ ───────────────►│  POST /api/postulaciones        │
└────────────┘                 │  (Astro SSR · Vercel Node 22)   │
                               │                                 │
                               │  1. rate limit + Zod            │
                               │  2. magic bytes / size          │
                               │  3. Storage.upload(cvs/…)       │
                               │  4. INSERT parse_status=pending │
                               │  5. return 200 { ok, parsing }  │
                               │  6. waitUntil → parseCv()       │
                               └────────────┬────────────────────┘
                                            │ background
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
             extract text            rule ± LLM               UPDATE row
             (+ OCR si hace falta)   keywords + match         keywords,
                                                              cv_parsed,
                                                              match_score

┌────────────┐  auth session   ┌─────────────────────────────────┐
│ Empleador  │ ───────────────►│  /empleador/.../postulaciones   │
└────────────┘                 │  RLS: solo sus ofertas          │
                               │  UI: tags · resumen · % match   │
                               └─────────────────────────────────┘
```

---

## 4. Backend: procesamiento de CVs

### 4.1 Punto de entrada

| | |
|---|---|
| **Ruta** | `src/pages/api/postulaciones.ts` |
| **Método** | `POST` `multipart/form-data` |
| **Campos** | `oferta_id`, `cv` (file), `nombre?`, `email?` |
| **Auth** | Pública (candidato); usa **service role** en servidor |

### 4.2 Contrato de calidad

- Validación fallida → 4xx (no se crea postulación).
- Upload/DB fallido → 5xx (se limpia storage si hace falta).
- **Parse fallido o lento → la postulación ya existe**; se marca `parse_status = failed` o queda `pending` hasta completar.
- Respuesta al candidato **no espera** OCR/LLM (`scheduleBackground` + `@vercel/functions` `waitUntil`).

### 4.3 Orquestador `parseCv()` (`src/lib/cv-parser/index.ts`)

```
validate (caller)
  → extractCvText (PDF/DOCX; OCR si texto nativo < ~80 chars)
  → parseWithRules (siempre)
  → parseWithLlm (si XAI_API_KEY)
  → merge hybrid
  → extractKeywords + skills Chile
  → computeMatchScore(ofertaTexto)
  → { status, cv_parsed, keywords, match_score }
```

| Módulo | Responsabilidad |
|--------|-----------------|
| `file-validation.ts` | Extensión, MIME, magic bytes (`%PDF`, `PK`, OLE) |
| `extract-text.ts` | pdf-parse / mammoth; limpieza de ruido de CV |
| `ocr.ts` | Fallback escaneados: OCR.space → tesseract spa+eng |
| `rule-parser.ts` | Email, teléfono CL, secciones, experiencia, skills |
| `keywords.ts` | Catálogo curado + frecuencia de tokens |
| `skills-chile.ts` | Skills técnicas/blandas y ubicaciones Chile |
| `llm-parser.ts` | JSON estructurado vía `api.x.ai` (opcional) |
| `match-score.ts` | Overlap keywords/skills vs texto de la oferta |

### 4.4 Dónde se ejecuta

| Entorno | Rol |
|----------|-----|
| **Vercel (Node 22)** | Primario: API + `parseCv` en background |
| **Supabase Edge `parse-cv`** | Secundario: reintento si `parse_status = failed` (opcional) |
| **Supabase Postgres/Storage** | Persistencia y CVs |

`maxDuration: 60` en el adapter de Vercel permite OCR/LLM sin cortar el background de forma inmediata (plan según límites de Vercel).

### 4.5 Edge Function `supabase/functions/parse-cv`

- Input: `{ postulation_id }`.
- Auth: `Authorization: Bearer <SERVICE_ROLE_KEY>`.
- Descarga el CV del storage, extrae texto (unpdf / docx zip), rules ± LLM, UPDATE.
- Útil para reprocesar fallidos sin redeploy del frontend.

---

## 5. Modelo de datos (postulaciones)

Columnas relevantes en `schema.sql` / `scripts/migration-cv-parse.sql`:

| Columna | Tipo | Descripción |
|--------|------|-------------|
| `cv_url` | text | Path en bucket `cvs` |
| `palabras_clave` | text[] | Legacy; se sigue escribiendo en sync con keywords |
| `keywords` | text[] | **Canónico** para UI y matching |
| `cv_parsed` | jsonb | Objeto estructurado (ver abajo) |
| `parse_status` | text | `pending` \| `success` \| `failed` \| `skipped` |
| `parsed_at` | timestamptz | Fin del parse |
| `match_score` | smallint | 0–100 o null |

### Shape de `cv_parsed`

```json
{
  "nombre_completo": "string|null",
  "email": "string|null",
  "telefono": "string|null",
  "titulo_profesional": "string|null",
  "resumen": "string|null",
  "experiencia": [{ "empresa", "cargo", "fecha_inicio", "fecha_fin", "descripcion" }],
  "educacion": [{ "institucion", "titulo", "fecha", "descripcion" }],
  "skills_tecnicas": ["..."],
  "skills_blandas": ["..."],
  "keywords": ["..."],
  "idiomas": [{ "idioma", "nivel" }],
  "anos_experiencia": 0,
  "ubicacion": "string|null",
  "parse_method": "rule|llm|hybrid|ocr",
  "used_ocr": false,
  "ocr_engine": "ocr_space|tesseract|none|null",
  "raw_text_length": 0,
  "warnings": []
}
```

Tipos TypeScript: `src/types/database.ts` y `src/lib/cv-parser/types.ts` (Zod).

---

## 6. Frontend: dashboard de postulaciones

**Ruta:** `/empleador/oferta/[id]/postulaciones`  
**Archivo:** `src/pages/empleador/oferta/[id]/postulaciones.astro`

| Elemento UI | Fuente de datos |
|-------------|-----------------|
| Chips indigo (skills/keywords) | `keywords` / `palabras_clave` / `cv_parsed.skills_tecnicas` |
| Chips emerald (blandas) | `cv_parsed.skills_blandas` |
| Resumen (card gris) | `cv_parsed.resumen` |
| % match | `match_score` |
| Badge “Analizando CV…” | `parse_status === 'pending'` |
| Badge OCR | `cv_parsed.used_ocr` |
| Filtro “Filtrar por skill…” | client-side sobre `data-keywords` |
| Orden default | `match_score` DESC |

Descarga del CV: `GET /api/postulaciones/cv?id=…` (empleador autenticado, URL firmada).

---

## 7. Seguridad

- Validación de archivo: extensión + MIME + **magic bytes**; máx. 5 MB.
- Rate limit en memoria: 3 postulaciones / IP / hora.
- Service role **solo** en API server / Edge (nunca en el browser).
- RLS: el empleador solo lee postulaciones de **sus** ofertas.
- Bucket `cvs` privado.
- Cron de limpieza (~90 días) en `api/cron/limpiar`.

---

## 8. Integraciones externas

| Servicio | Uso |
|----------|-----|
| Supabase Storage / Auth / Postgres | Core backend |
| xAI (`api.x.ai`) | Parse estructurado opcional |
| OCR.space | OCR multipágina opcional (serverless-friendly) |
| OpenStreetMap / Leaflet | Mapa de ofertas |
| Vercel | Hosting SSR + `waitUntil` |

---

## 9. Roadmap (post Tier 1)

- Cola dedicada (Inngest / Supabase Queue) si el volumen crece.
- Embeddings / match semántico.
- Redis para rate limit multi-instancia.
- OCR de más páginas / calidad empresarial (Vision API) si se requiere más allá del stack actual (OCR.space + tesseract).

---

## 10. Glosario

| Término | Significado |
|---------|-------------|
| **keywords** | Array de términos para matching y chips en UI |
| **cv_parsed** | JSON estructurado del CV |
| **parse_status** | Estado del pipeline de análisis |
| **match_score** | Afinidad heurística CV ↔ oferta (0–100) |
| **fail-open** | El parse no impide completar la postulación |
| **hybrid** | Rules + LLM fusionados |
