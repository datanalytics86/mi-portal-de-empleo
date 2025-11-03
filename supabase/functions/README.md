# Supabase Edge Functions

Funciones serverless para procesamiento backend del Portal de Empleos Chile.

## 📁 Funciones Disponibles

### `parse-cv`

Extrae metadatos estructurados de CVs en PDF usando Claude AI.

**Endpoint:** `POST /functions/v1/parse-cv`

**Request Body:**
```json
{
  "postulacionId": "uuid-de-postulacion",
  "cvPath": "cvs/uuid-timestamp-archivo.pdf"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "postulacionId": "...",
    "metadata": {
      "nombre_completo": "Juan Pérez",
      "email_extraido": "juan@email.com",
      "habilidades": ["JavaScript", "React"],
      ...
    },
    "confianzaScore": 0.92,
    "extractedChars": 3542
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🚀 Deployment

### Requisitos Previos

1. **Supabase CLI** instalado:
   ```bash
   npm install -g supabase
   ```

2. **Login a Supabase:**
   ```bash
   supabase login
   ```

3. **Link al proyecto:**
   ```bash
   supabase link --project-ref tu-project-ref
   ```

### Deploy de Funciones

```bash
# Deploy todas las funciones
supabase functions deploy

# Deploy una función específica
supabase functions deploy parse-cv

# Deploy con secrets
supabase functions deploy parse-cv \
  --no-verify-jwt \
  --env-file .env.local
```

### Configurar Secrets

```bash
# Anthropic API Key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Verificar secrets
supabase secrets list
```

---

## 🧪 Testing Local

### 1. Servir función localmente

```bash
supabase functions serve parse-cv --env-file .env.local --no-verify-jwt
```

### 2. Invocar con curl

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/parse-cv' \
  --header 'Authorization: Bearer SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"postulacionId":"uuid-aqui","cvPath":"cvs/test.pdf"}'
```

### 3. Ver logs

```bash
supabase functions logs parse-cv --local
```

---

## 🔐 Variables de Entorno Requeridas

### En Supabase Dashboard (Production)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | API Key de Anthropic Claude | `sk-ant-api03-...` |

### En `.env.local` (Development)

```env
# Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## 📊 Monitoring

### Ver logs en producción

```bash
# Últimos logs
supabase functions logs parse-cv

# Logs en tiempo real
supabase functions logs parse-cv --tail

# Logs con filtro
supabase functions logs parse-cv --filter "error"
```

### Métricas en Dashboard

1. Ir a: `https://app.supabase.com/project/TU_PROJECT/functions`
2. Seleccionar función `parse-cv`
3. Ver:
   - Invocaciones totales
   - Errores (tasa de error)
   - Latencia promedio
   - Uso de CPU/Memory

---

## 🐛 Troubleshooting

### Error: "ANTHROPIC_API_KEY not configured"

**Solución:**
```bash
supabase secrets set ANTHROPIC_API_KEY=tu-clave-aqui
supabase functions deploy parse-cv
```

### Error: "Failed to download PDF"

**Causas posibles:**
- El archivo no existe en Storage
- RLS policy bloqueando acceso
- Path incorrecto

**Solución:**
Verificar que el Service Role Key tenga permisos:
```sql
-- Verificar políticas en bucket 'archivos'
SELECT * FROM storage.policies WHERE bucket_id = 'archivos';
```

### Error: "PDF appears to be empty or unreadable"

**Causa:** PDF escaneado (imagen) sin OCR

**Solución temporal:** Rechazar PDFs escaneados en frontend

**Solución futura:** Implementar OCR (Google Vision, Tesseract)

### Error: "Failed to parse AI response as JSON"

**Causa:** Claude retornó texto que no es JSON válido

**Debug:**
1. Ver logs: `supabase functions logs parse-cv`
2. Buscar "Raw response:"
3. Ajustar prompt si es necesario

---

## 💰 Costos Estimados

### Supabase Edge Functions
- **Free Tier:** 500K invocaciones/mes
- **Después:** $2 por millón de invocaciones

### Anthropic Claude API
- **Input:** $3 por 1M tokens
- **Output:** $15 por 1M tokens
- **Estimado por CV:** ~$0.006

### Total estimado (1000 CVs/mes)
- Edge Functions: **Gratis** (bajo límite)
- Claude API: **$6/mes**
- **Total: ~$6/mes**

---

## 🔄 Flujo Completo

```
Usuario sube CV
      ↓
API /postular.ts guarda en Storage
      ↓
Llama Edge Function parse-cv (async)
      ↓
parse-cv descarga PDF
      ↓
Extrae texto del PDF
      ↓
Envía a Claude AI
      ↓
Claude retorna JSON con metadatos
      ↓
Guarda en tabla cv_metadata
      ↓
Empleador ve match score en dashboard
```

---

## 📚 Referencias

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Deno Runtime](https://deno.land/manual)
- [PDF Parsing in Deno](https://deno.land/x/pdf)

---

## 🔮 Roadmap Futuro

- [ ] OCR para PDFs escaneados (Google Vision API)
- [ ] Soporte para DOC/DOCX (con LibreOffice headless)
- [ ] Rate limiting por usuario
- [ ] Caché de resultados (evitar re-parsing)
- [ ] Webhooks para notificaciones
- [ ] Batch processing nocturno (más económico)
- [ ] Fallback a GPT-4 si Claude falla
- [ ] Métricas de calidad de parsing
