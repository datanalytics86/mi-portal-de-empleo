# Especificaciones — mi-portal-de-empleo

Portal de empleos georeferenciado para Chile.  
**Versión de documento:** 2026-07-13 (Tier 1 — parsing de CVs documentado y alineado al código).

---

## 1. Contexto y objetivo

Conectar candidatos con ofertas laborales en Chile con fricción mínima:

- **Candidatos:** sin registro; postulan subiendo un CV.
- **Empleadores:** registro con email/contraseña; publican ofertas con comuna/mapa; revisan postulaciones.
- **Diferenciador Tier 1:** tras la subida del CV se **extraen keywords y un perfil estructurado** para que el empleador priorice sin abrir cada PDF.

**Principios**

- Minimalismo visual y funcional  
- Mobile-first  
- Seguridad y privacidad por defecto  
- Shipping beats perfection  

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Astro 5.x + TypeScript + Tailwind CSS |
| Mapa | Leaflet 1.9+ · OpenStreetMap |
| Backend | Supabase (PostgreSQL + Storage + Auth) |
| Validación | Zod |
| CV texto | pdf-parse (PDF), mammoth (DOCX) |
| CV OCR (opcional) | OCR.space y/o tesseract.js + pdfjs-dist + @napi-rs/canvas |
| CV LLM (opcional) | xAI Grok (`XAI_API_KEY`) |
| Deploy | Vercel (SSR) + Supabase Cloud |

> Nota: el schema de producción usa columnas `lat`/`lng` (no PostGIS obligatorio en el código actual). `schema.sql` es la fuente de verdad.

---

## 3. Base de datos (resumen)

### 3.1 Tablas principales

- **empleadores** — `id` = `auth.users.id`, email, empresa  
- **ofertas** — título, descripción, empresa, tipo_empleo, categoría, comuna, lat, lng, activa, expira_en, empleador_id  
- **postulaciones** — ver §5 (campos de parsing)

### 3.2 RLS (idea general)

- Ofertas activas/no expiradas: lectura pública.  
- Empleador: CRUD de sus ofertas.  
- Postulaciones: SELECT solo del empleador dueño de la oferta; INSERT público (validación real en API con service role).  

Detalle exacto: `schema.sql`.

---

## 4. Flujos de usuario

### 4.1 Candidato

1. Home `/` — mapa + lista + filtros.  
2. Detalle `/oferta/[id]`.  
3. Form: nombre (opc.), email (opc.), CV (req.), privacidad.  
4. Drag & drop o selector de archivo; validación cliente (tipo/tamaño).  
5. `POST /api/postulaciones` → éxito inmediato (`?exito=1`).  
6. En background se analiza el CV (keywords / resumen).  

### 4.2 Empleador

1. Registro / login.  
2. Dashboard de ofertas.  
3. Nueva oferta (plantillas Tecnología / Ventas / Admin / Práctica).  
4. **Postulaciones** `/empleador/oferta/[id]/postulaciones`:  
   - Chips de keywords  
   - Resumen del CV  
   - % match  
   - Filtro por skill  
   - Orden por match / fecha / nombre  
   - Descargar CV, copiar emails, export CSV  

---

## 5. FEATURE TIER 1 — Parsing automático de CVs

### 5.1 Objetivo

Inmediatamente **después** de guardar el CV en Storage y crear la fila de postulación, extraer:

1. Texto limpio del documento.  
2. **Keywords / skills** (mercado laboral Chile).  
3. **Datos estructurados** (perfil, experiencia, educación, etc.).  
4. **match_score** opcional frente al texto de la oferta.  

La postulación **nunca depende** del éxito del parse.

### 5.2 Formatos soportados

| Formato | Soporte | Comportamiento |
|---------|---------|----------------|
| PDF con capa de texto | Completo | `pdf-parse` |
| PDF escaneado | OCR opcional | Si nativo &lt; ~80 chars → OCR; si falla → `parse_status=failed`, CV igual guardado |
| DOCX | Completo | `mammoth` |
| DOC legacy (OLE) | Degradado | `parse_status=skipped` |

Validación: extensión + MIME + **magic bytes** + máx. **5 MB**.

### 5.3 Qué se extrae

#### Keywords (`keywords text[]` y `palabras_clave text[]`)

- Catálogo de skills técnicas y blandas (Chile) + frecuencia de tokens del texto.  
- Stopwords en español.  
- Hasta ~25–30 términos.  
- Se escriben **ambos** campos (canónico + legacy) para no romper clientes antiguos.

#### Objeto `cv_parsed` (jsonb)

| Campo | Descripción |
|-------|-------------|
| `nombre_completo` | Si se detecta o viene del form |
| `email`, `telefono` | Regex (teléfonos estilo Chile) |
| `titulo_profesional` | Cargo / headline |
| `resumen` | Perfil u objetivo (corto) |
| `experiencia[]` | empresa, cargo, fechas, descripción |
| `educacion[]` | institución, título, fecha |
| `skills_tecnicas[]` / `skills_blandas[]` | Del catálogo + LLM |
| `keywords[]` | Lista unificada |
| `idiomas[]` | idioma + nivel |
| `anos_experiencia` | Aproximado |
| `ubicacion` | Comuna/ciudad si aparece |
| `parse_method` | `rule` \| `llm` \| `hybrid` \| `ocr` |
| `used_ocr`, `ocr_engine` | Trazabilidad OCR |
| `raw_text_length`, `warnings[]` | Debug / UX |

Validación de forma: Zod en `src/lib/cv-parser/types.ts`.

### 5.4 Columnas en `postulaciones`

| Columna | Tipo | Valores / notas |
|--------|------|-----------------|
| `cv_url` | text | Path en bucket `cvs` |
| `palabras_clave` | text[] | Legacy |
| `keywords` | text[] | Canónico UI/matching |
| `cv_parsed` | jsonb | Perfil estructurado |
| `parse_status` | text | `pending` · `success` · `failed` · `skipped` |
| `parsed_at` | timestamptz | Timestamp del parse |
| `match_score` | smallint | 0–100 o null |

Migración incremental: `scripts/migration-cv-parse.sql`.  
Schema completo: `schema.sql`.

### 5.5 Flujo técnico actualizado

```
1. Cliente valida archivo (extensión, 5 MB) y envía FormData
2. API valida Zod + magic bytes + rate limit (3/IP/hora)
3. Verifica oferta activa y no expirada
4. Upload a Storage bucket "cvs"
5. INSERT postulaciones:
     parse_status = 'pending'
     keywords = '{}'
6. Respuesta HTTP 200 { ok: true, id, parsing: true }   ← candidato no espera
7. Background (Vercel waitUntil):
     a. extractCvText (+ OCR si hace falta)
     b. parseWithRules
     c. parseWithLlm si hay XAI_API_KEY
     d. keywords + match_score
     e. UPDATE postulaciones
     f. si failed y hay SUPABASE_EDGE_PARSE_CV_URL → reintento Edge
```

**Código clave**

| Pieza | Ruta |
|-------|------|
| API | `src/pages/api/postulaciones.ts` |
| Parser | `src/lib/cv-parser/*` |
| Edge reintento | `supabase/functions/parse-cv` |
| UI empleador | `src/pages/empleador/oferta/[id]/postulaciones.astro` |

### 5.6 Match score (bonus v1)

Heurística **no-ML**:

- Solapamiento de keywords/skills con título + descripción + categoría de la oferta.  
- Bonus por años de experiencia mencionados en la oferta.  
- Rango 0–100; se muestra como badge en el dashboard.  

### 5.7 UX

**Candidato**

- Dropzone “Arrastra tu CV aquí”.  
- Botón “Enviando…” → éxito confetti.  
- Mensaje: CV recibido; el empleador verá resumen/keywords; retención 90 días.  

**Empleador**

- Chips indigo (técnicas / keywords).  
- Chips emerald (blandas).  
- Card de resumen (si hay `cv_parsed.resumen`).  
- Badge % match, “Analizando CV…”, “OCR”, “Sin análisis”.  
- Filtro por skill y orden por match (default).  

### 5.8 Seguridad y límites

| Control | Valor |
|---------|--------|
| Tamaño CV | ≤ 5 MB |
| Rate limit | 3 postulaciones / IP / hora |
| Magic bytes | PDF / DOCX / DOC |
| Service role | Solo servidor |
| RLS | Empleador ve solo sus postulaciones |
| Retención | ~90 días (cron) |

### 5.9 Variables de entorno (parse)

| Variable | Requerida | Uso |
|----------|-----------|-----|
| `SUPABASE_*` | Sí | Backend |
| `XAI_API_KEY` | No | LLM structured |
| `XAI_MODEL` | No | Default `grok-3-mini` |
| `OCR_SPACE_API_KEY` | No | OCR cloud |
| `CV_OCR_ENABLED` | No | Default true |
| `CV_OCR_MAX_PAGES` | No | Default 3 |
| `SUPABASE_EDGE_PARSE_CV_URL` | No | Reintentos |

### 5.10 Deploy e integración

Ver **[DEPLOY-CV-PARSE.md](./DEPLOY-CV-PARSE.md)** y **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

Checklist mínimo:

1. [ ] SQL migración o `schema.sql` aplicado  
2. [ ] Env en Vercel  
3. [ ] Postular PDF con texto → `parse_status=success` y chips en dashboard  
4. [ ] PDF ilegible / OCR off → postulación OK, `failed` o sin keywords  
5. [ ] Empleador filtra por una skill conocida  

---

## 6. Diseño UI (resumen)

- Paleta brand indigo/azul; superficies blancas; bordes suaves.  
- Tipografía Inter.  
- Componentes: tarjetas de oferta, form de postulación, mapa, dashboard empleador.  
- Open Graph en `Layout.astro` para compartir ofertas (WhatsApp/LinkedIn).  

---

## 7. Criterios de éxito (producto)

| Métrica | Objetivo |
|---------|----------|
| Time to first postulation | &lt; 60 s (candidato) |
| Tiempo percibido de envío | Respuesta API &lt; ~3 s (parse en background) |
| Empleador “decide abrir CV” | Keywords + match visibles sin descargar |
| Disponibilidad | Deploy Vercel + Supabase managed |

---

## 8. Fuera de alcance (no Tier 1)

- Registro de candidatos / perfiles  
- Chat o ATS con etapas Kanban  
- Embeddings / ranking ML  
- App nativa  
- Moderación admin completa  

---

## 9. Referencias de código

```
src/lib/cv-parser/index.ts
src/pages/api/postulaciones.ts
src/pages/empleador/oferta/[id]/postulaciones.astro
schema.sql
scripts/migration-cv-parse.sql
```
