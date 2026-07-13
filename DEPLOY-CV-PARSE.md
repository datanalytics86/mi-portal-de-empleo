# Deploy: Parsing automático de CVs (Tier 1)

## Resumen del flujo

```
Candidato sube CV
    → POST /api/postulaciones (Astro en Vercel)
    → Validación MIME + magic bytes
    → Upload bucket `cvs` (Supabase Storage)
    → INSERT postulaciones (parse_status = pending)
    → 200 { ok: true, parsing: true }   ← respuesta inmediata al candidato
    → Background (waitUntil):
         extract text (pdf-parse / mammoth)
         → si PDF sin texto: OCR (OCR.space y/o tesseract)
         → rule-based structure + keywords Chile
         → opcional: xAI Grok (XAI_API_KEY)
         → match_score vs oferta
         → UPDATE cv_parsed, keywords, parse_status, match_score
    → (opcional) Edge Function parse-cv si falló el parse
```

Si el parsing falla (.doc, OCR sin resultado, error de red LLM), el CV y la postulación **quedan guardados** igual.

Docs de producto: [SPECIFICATIONS.md](./SPECIFICATIONS.md) §5 · Arquitectura: [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 1. Migración SQL (obligatorio)

En **Supabase Dashboard → SQL Editor**, ejecuta:

```bash
# Archivo del repo:
scripts/migration-cv-parse.sql
```

O pega el contenido de ese archivo y Run.

Verifica:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'postulaciones'
  AND column_name IN ('cv_parsed','keywords','parse_status','parsed_at','match_score');
```

Proyectos nuevos pueden usar el `schema.sql` actualizado completo.

---

## 2. Variables de entorno

### Vercel (Production + Preview)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `PUBLIC_SUPABASE_URL` | Sí | URL del proyecto |
| `PUBLIC_SUPABASE_ANON_KEY` | Sí | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Service role (solo server) |
| `XAI_API_KEY` | Recomendada | API key de https://console.x.ai |
| `XAI_MODEL` | No | Default: `grok-3-mini` |
| `SUPABASE_EDGE_PARSE_CV_URL` | No | `https://<ref>.supabase.co/functions/v1/parse-cv` |
| `CV_OCR_ENABLED` | No | Default `true`. Pon `false` para desactivar OCR |
| `CV_OCR_MAX_PAGES` | No | Default `3` (páginas a OCR) |
| `CV_OCR_TIMEOUT_MS` | No | Default `50000` |
| `OCR_SPACE_API_KEY` | **Recomendada en Vercel** | https://ocr.space/ocrapi — cloud, multipágina |

### Local (`.env`)

Copia `.env.example` y completa.

```bash
npm install
npm run dev
```

---

## 3. Deploy frontend (Vercel)

```bash
# Desde la raíz del repo
npm install
npm run build   # verificar que compila
vercel --prod   # o push a main si ya hay integración Git
```

Asegúrate de que las env vars estén en el dashboard de Vercel **antes** del deploy.

---

## 4. Edge Function `parse-cv` (opcional, reintentos)

La función re-procesa una postulación ya creada (descarga el CV del storage).

### Requisitos

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Login: `supabase login`
- Link: `supabase link --project-ref <tu-ref>`

### Deploy

```bash
# Desde la raíz del repo
supabase functions deploy parse-cv --no-verify-jwt

# Secrets (XAI opcional pero recomendado)
supabase secrets set XAI_API_KEY=xai-...
supabase secrets set XAI_MODEL=grok-3-mini
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya existen en el runtime de Edge Functions.

### Probar

```bash
curl -X POST "https://<ref>.supabase.co/functions/v1/parse-cv" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"postulation_id":"<uuid-de-postulacion>"}'
```

### Conectar reintentos desde Vercel

En Vercel:

```
SUPABASE_EDGE_PARSE_CV_URL=https://<ref>.supabase.co/functions/v1/parse-cv
```

El API de postulaciones llama a la edge function en fire-and-forget solo si `parse_status === 'failed'`.

---

## 5. Checklist de verificación

1. [ ] Migración SQL aplicada
2. [ ] Env vars en Vercel (service role + opcional XAI)
3. [ ] Postular con un **PDF con texto** real → `parse_status = success`
4. [ ] Dashboard empleador muestra tags, resumen y % match
5. [ ] Postular con **.doc** legacy → postulación OK, `parse_status = skipped`
6. [ ] PDF escaneado → OCR → `parse_status = success`, `cv_parsed.used_ocr = true`, badge OCR en dashboard
7. [ ] PDF escaneado con OCR deshabilitado/fallido → postulación OK, `parse_status = failed`
8. [ ] Rate limit: 4ª postulación en 1h desde la misma IP → 429
9. [ ] Archivo renombrado `.pdf` que es basura → 400 magic bytes

---

## 5b. OCR — PDFs escaneados

### Cómo funciona

1. `pdf-parse` intenta texto nativo.
2. Si hay &lt; ~80 caracteres útiles → se considera escaneado.
3. **OCR.space** (si hay `OCR_SPACE_API_KEY`) — preferido en serverless.
4. Si no hay key o falla → **tesseract.js** + render de páginas (`pdfjs-dist` + `@napi-rs/canvas`), español+inglés, máx. N páginas.
5. Timeout global (`CV_OCR_TIMEOUT_MS`). Fail-open.

### Recomendación producción (Vercel)

```env
OCR_SPACE_API_KEY=tu_free_key   # https://ocr.space/ocrapi/freekey
CV_OCR_MAX_PAGES=3
CV_OCR_TIMEOUT_MS=50000
```

- Plan Vercel: `maxDuration: 60` ya configurado en `astro.config.mjs` (Pro/Fluid; Hobby puede truncar).
- Tesseract local es más lento y pesa más en cold start; OCR.space evita eso.

### Desactivar

```env
CV_OCR_ENABLED=false
```

---

## 6. Observabilidad

Logs en Vercel Functions:

```
[postulaciones] parse success id=... keywords=18 score=72
[parse-cv] ok method=hybrid keywords=18 ms=1402
[llm-parser] xAI error 429 ...
```

Consultas útiles:

```sql
SELECT parse_status, count(*) FROM postulaciones GROUP BY 1;

SELECT id, nombre, match_score, keywords, parse_status
FROM postulaciones
ORDER BY created_at DESC
LIMIT 20;
```

---

## 7. Costos LLM (xAI)

- Sin `XAI_API_KEY`: solo rule-based (gratis, bueno).
- Con key: ~1 request por postulación, modelo económico `grok-3-mini`.
- Timeout LLM: 18s; si falla, se conserva el resultado rule-based.

---

## 8. Seguridad

- Validación de archivo: extensión + MIME + **magic bytes**
- Service role solo en server / edge (nunca en el browser)
- Edge Function exige `Authorization: Bearer <service_role>`
- Rate limit: 3 postulaciones / IP / hora
- CVs en bucket privado; descarga vía `/api/postulaciones/cv` autenticado
