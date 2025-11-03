# Análisis: Funcionalidad de Carga de CVs y Propuesta de IA

**Fecha:** 2025-11-03
**Estado:** Análisis y Propuesta Técnica

---

## 📊 Estado Actual de Carga de PDFs

### ✅ Funcionalidades Implementadas

#### 1. **Validación de Archivos** (`src/lib/validations.ts`)

```typescript
// Tipos permitidos actualmente
ALLOWED_CV_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
]

// Límites
MAX_CV_SIZE = 5MB
ALLOWED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx']
```

**Validaciones implementadas:**
- ✅ Tipo MIME
- ✅ Tamaño máximo (5MB)
- ✅ Extensión de archivo
- ✅ Nombre de archivo (longitud y caracteres peligrosos)
- ⚠️ **FALTA:** Validación de magic bytes (seguridad)
- ⚠️ **FALTA:** Extracción de contenido/metadatos

#### 2. **Almacenamiento en Supabase Storage** (`src/lib/storage.ts`)

```typescript
// Funciones disponibles
- uploadCV(file, postulacionId) → Sube a bucket 'archivos'
- getSignedUrl(path, expiresIn) → URL temporal para descarga
- deleteCV(path) → Elimina archivo
- validateCV(file) → Solo valida PDF
```

**⚠️ LIMITACIÓN CRÍTICA:**
```typescript
// En storage.ts solo acepta PDF
const ALLOWED_TYPES = ['application/pdf']

// Pero en validations.ts acepta DOC y DOCX
// INCONSISTENCIA: Hay que decidir qué formatos soportar
```

**Almacenamiento actual:**
- ✅ Rutas únicas: `cvs/{postulacionId}-{timestamp}-{filename}`
- ✅ URLs firmadas con expiración (1 año)
- ✅ Control de acceso (Supabase RLS)
- ❌ **NO se extrae ningún dato del contenido**
- ❌ **NO se indexa para búsqueda**

#### 3. **Formulario de Postulación** (`src/components/FormularioPostulacion.astro`)

**Características:**
- ✅ Drag & drop de archivos
- ✅ Vista previa del archivo seleccionado
- ✅ Validación en tiempo real (cliente)
- ✅ Indicador de tamaño de archivo
- ✅ UX moderna con estados visuales

**Datos capturados:**
```typescript
{
  nombre: string | null,        // Opcional
  email: string | null,         // Opcional
  telefono: string | null,      // Opcional
  mensaje: string | null,       // Opcional
  cv_file: File,                // Requerido
  cv_url: string,               // Path en Storage
  cv_nombre: string,            // Nombre original
  cv_size: number              // Tamaño en bytes
}
```

**❌ NO se captura:**
- Contenido textual del CV
- Habilidades detectadas
- Experiencia laboral
- Educación
- Idiomas
- Palabras clave
- Metadatos estructurados

---

## 🚨 Problemas Detectados

### 1. **Inconsistencia de Formatos Aceptados**

- `storage.ts` → Solo PDF
- `validations.ts` → PDF, DOC, DOCX
- `FormularioPostulacion.astro` → Acepta los 3

**Recomendación:** Estandarizar a **SOLO PDF**
- Más seguro (menos vectores de ataque)
- Más fácil de procesar con IA
- Universal (todos pueden exportar a PDF)
- Menor superficie de ataque (exploits en parsers de DOC)

### 2. **Sin Extracción de Información**

Actualmente los CVs son "cajas negras":
- Se suben pero no se leen
- No se pueden buscar candidatos por habilidades
- No se pueden filtrar por experiencia
- No hay matching automático con ofertas

### 3. **Sin Base de Datos de Talento**

No existe tabla para:
- Pool de candidatos
- Habilidades registradas
- Historial de postulaciones
- Scoring de candidatos

---

## 🤖 Propuesta: IA para Parsing de CVs

### Arquitectura Recomendada

```
┌─────────────────┐
│  Usuario sube   │
│      CV.pdf     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Storage│  ← Almacenamiento seguro
│  bucket: cvs/   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Database Trigger│  ← ON INSERT en tabla postulaciones
│ o Edge Function │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PDF → Texto    │  ← pdf-parse o Supabase Edge Function
│  Extracción     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Claude API     │  ← Anthropic Claude 3.5 Sonnet
│  o GPT-4        │     (Mejor para parsing estructurado)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JSON Metadata   │  ← Datos estructurados
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Tabla:          │
│ cv_metadata     │  ← PostgreSQL + Full-text search
└─────────────────┘
```

### Opciones de IA (Comparación)

| Servicio | Pros | Contras | Costo (estimado) |
|----------|------|---------|------------------|
| **Claude 3.5 Sonnet** ✅ | • Excelente para documentos<br>• API simple<br>• 200K tokens contexto<br>• Preciso en español | • Requiere API key<br>• Latencia ~2-3s | $3 por 1M tokens input<br>~$0.006 por CV |
| **GPT-4 Turbo** | • Muy conocido<br>• Buena documentación<br>• JSON mode nativo | • Más caro<br>• Latencia variable | $10 por 1M tokens<br>~$0.020 por CV |
| **GPT-3.5 Turbo** | • Más barato<br>• Rápido | • Menos preciso<br>• Errores en español | $0.50 por 1M tokens<br>~$0.001 por CV |
| **Ollama Local** | • Gratis<br>• Sin límites<br>• Privacidad | • Requiere GPU<br>• Más complejo<br>• Latencia alta | $0 (infraestructura) |
| **Servicios SaaS** | • Específico para CVs<br>• Sin código | • Vendor lock-in<br>• Caro a escala | $0.10-$0.50 por CV |

**Recomendación:** **Claude 3.5 Sonnet** por:
- Mejor relación costo/calidad
- Excelente en español
- Fácil integración con Supabase Edge Functions
- JSON estructurado confiable

---

## 🗄️ Esquema de Base de Datos Propuesto

### Nueva Tabla: `cv_metadata`

```sql
CREATE TABLE cv_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  postulacion_id UUID NOT NULL REFERENCES postulaciones(id) ON DELETE CASCADE,

  -- Datos extraídos por IA
  nombre_completo VARCHAR(255),
  email_extraido VARCHAR(255),
  telefono_extraido VARCHAR(50),

  -- Información profesional
  titulo_profesional VARCHAR(255),
  resumen TEXT,
  anos_experiencia INTEGER,

  -- Arrays para búsqueda
  habilidades TEXT[],           -- ["JavaScript", "React", "Node.js"]
  idiomas JSONB,                -- [{"idioma": "Inglés", "nivel": "Avanzado"}]

  -- Experiencia laboral
  experiencia JSONB,            -- Array de trabajos
  educacion JSONB,              -- Array de estudios
  certificaciones TEXT[],

  -- Metadatos del parsing
  texto_completo TEXT,          -- Full text del CV
  confianza_score DECIMAL(3,2), -- 0.00 - 1.00 (confianza de la IA)
  modelo_usado VARCHAR(50),     -- "claude-3.5-sonnet"

  -- Full-text search
  search_vector TSVECTOR,       -- Para búsqueda rápida en español

  -- Timestamps
  parsed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_cv_metadata_postulacion ON cv_metadata(postulacion_id);
CREATE INDEX idx_cv_metadata_habilidades ON cv_metadata USING GIN(habilidades);
CREATE INDEX idx_cv_metadata_search ON cv_metadata USING GIN(search_vector);

-- Full-text search en español
CREATE INDEX idx_cv_metadata_fts ON cv_metadata
  USING GIN(to_tsvector('spanish', coalesce(texto_completo, '')));

-- Trigger para actualizar search_vector
CREATE TRIGGER cv_metadata_search_vector_update
BEFORE INSERT OR UPDATE ON cv_metadata
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.spanish',
    nombre_completo, titulo_profesional, resumen, texto_completo);
```

### Ejemplo de Datos Almacenados

```json
{
  "postulacion_id": "uuid-aqui",
  "nombre_completo": "María González Silva",
  "email_extraido": "maria.gonzalez@email.com",
  "telefono_extraido": "+56912345678",
  "titulo_profesional": "Desarrolladora Full Stack Senior",
  "resumen": "Ingeniera en Informática con 8 años de experiencia...",
  "anos_experiencia": 8,
  "habilidades": [
    "JavaScript", "TypeScript", "React", "Node.js",
    "PostgreSQL", "AWS", "Docker", "Git"
  ],
  "idiomas": [
    {"idioma": "Español", "nivel": "Nativo"},
    {"idioma": "Inglés", "nivel": "Avanzado (C1)"},
    {"idioma": "Portugués", "nivel": "Intermedio"}
  ],
  "experiencia": [
    {
      "empresa": "TechCorp Chile",
      "cargo": "Senior Full Stack Developer",
      "desde": "2020-03",
      "hasta": "presente",
      "descripcion": "Lideré equipo de 5 desarrolladores...",
      "logros": ["Redujo tiempo de carga 60%", "Implementó CI/CD"]
    },
    {
      "empresa": "StartupXYZ",
      "cargo": "Full Stack Developer",
      "desde": "2017-01",
      "hasta": "2020-02",
      "descripcion": "Desarrollo de plataforma SaaS..."
    }
  ],
  "educacion": [
    {
      "institucion": "Universidad de Chile",
      "titulo": "Ingeniería Civil en Computación",
      "desde": "2011",
      "hasta": "2016"
    }
  ],
  "certificaciones": [
    "AWS Certified Solutions Architect",
    "Scrum Master Certified"
  ],
  "confianza_score": 0.95,
  "modelo_usado": "claude-3.5-sonnet-20241022"
}
```

---

## 💡 Funcionalidades Nuevas Habilitadas

### 1. **Búsqueda Inteligente de Candidatos**

```sql
-- Buscar candidatos con React y +5 años experiencia
SELECT p.*, cm.habilidades, cm.anos_experiencia
FROM postulaciones p
JOIN cv_metadata cm ON cm.postulacion_id = p.id
WHERE 'React' = ANY(cm.habilidades)
  AND cm.anos_experiencia >= 5
ORDER BY cm.anos_experiencia DESC;
```

### 2. **Matching Automático Oferta-Candidato**

Algoritmo de scoring:
```typescript
function calcularMatch(oferta: Oferta, cv: CVMetadata): number {
  let score = 0;

  // Habilidades requeridas (50%)
  const habilidadesMatch = oferta.requisitos.filter(req =>
    cv.habilidades.includes(req)
  ).length / oferta.requisitos.length;
  score += habilidadesMatch * 50;

  // Años de experiencia (30%)
  if (cv.anos_experiencia >= oferta.anos_min_requeridos) {
    score += 30;
  }

  // Ubicación (10%)
  if (cv.region === oferta.region) {
    score += 10;
  }

  // Idiomas (10%)
  const idiomasMatch = oferta.idiomas_requeridos.every(idioma =>
    cv.idiomas.some(i => i.idioma === idioma && i.nivel >= "Intermedio")
  );
  if (idiomasMatch) score += 10;

  return score; // 0-100
}
```

### 3. **Dashboard para Empleadores**

Nuevas features en `/empleador/dashboard`:
- 📊 **Top candidatos** por match score
- 🔍 **Filtros avanzados** (habilidades, experiencia, ubicación)
- 📈 **Estadísticas** (habilidades más comunes, experiencia promedio)
- 🏆 **Ranking automático** de postulantes

### 4. **Análisis de Mercado Laboral**

Queries para insights:
```sql
-- Habilidades más demandadas
SELECT unnest(habilidades) as habilidad, COUNT(*) as cantidad
FROM cv_metadata
GROUP BY habilidad
ORDER BY cantidad DESC
LIMIT 20;

-- Salario promedio por años de experiencia
SELECT
  CASE
    WHEN anos_experiencia < 2 THEN 'Junior (0-2 años)'
    WHEN anos_experiencia < 5 THEN 'Mid (2-5 años)'
    ELSE 'Senior (5+ años)'
  END as nivel,
  COUNT(*) as candidatos,
  AVG(anos_experiencia) as experiencia_promedio
FROM cv_metadata
GROUP BY nivel;
```

---

## 🛠️ Implementación Paso a Paso

### FASE 1: Setup Básico (1 día)

1. **Crear tabla `cv_metadata`** en Supabase
2. **Configurar API de Anthropic** (obtener API key)
3. **Actualizar .env**:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### FASE 2: Supabase Edge Function (2 días)

Crear Edge Function `parse-cv`:

```typescript
// supabase/functions/parse-cv/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

serve(async (req) => {
  const { postulacionId, cvPath } = await req.json()

  // 1. Descargar PDF de Storage
  const supabase = createClient(...)
  const { data: pdfBlob } = await supabase.storage
    .from('archivos')
    .download(cvPath)

  // 2. Convertir PDF a texto
  const pdfText = await extractTextFromPDF(pdfBlob)

  // 3. Enviar a Claude para parsing
  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  })

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Extrae información estructurada de este CV en español.

CV:
${pdfText}

Responde SOLO con JSON válido con esta estructura:
{
  "nombre_completo": "string",
  "email_extraido": "string",
  "telefono_extraido": "string",
  "titulo_profesional": "string",
  "resumen": "string (máximo 500 caracteres)",
  "anos_experiencia": number,
  "habilidades": ["array", "de", "strings"],
  "idiomas": [{"idioma": "string", "nivel": "string"}],
  "experiencia": [{
    "empresa": "string",
    "cargo": "string",
    "desde": "YYYY-MM",
    "hasta": "YYYY-MM o 'presente'",
    "descripcion": "string"
  }],
  "educacion": [{
    "institucion": "string",
    "titulo": "string",
    "desde": "YYYY",
    "hasta": "YYYY"
  }],
  "certificaciones": ["array"]
}`
    }]
  })

  const metadata = JSON.parse(message.content[0].text)

  // 4. Guardar en cv_metadata
  await supabase.from('cv_metadata').insert({
    postulacion_id: postulacionId,
    ...metadata,
    texto_completo: pdfText,
    modelo_usado: 'claude-3-5-sonnet-20241022',
    confianza_score: 0.95 // Calcular basado en completitud
  })

  return new Response(JSON.stringify({ success: true }))
})
```

### FASE 3: Trigger Automático (1 día)

Invocar Edge Function automáticamente al subir CV:

```typescript
// src/pages/api/postular.ts
// Después de subir CV exitosamente

if (isSupabaseConfigured()) {
  // Invocar Edge Function de manera asíncrona (no-blocking)
  fetch(`${SUPABASE_URL}/functions/v1/parse-cv`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      postulacionId,
      cvPath: cvData.path
    })
  }).catch(err => {
    // Log error pero no bloquear postulación
    console.error('[CV Parsing] Error:', err)
  })
}
```

### FASE 4: UI de Búsqueda (2 días)

Crear `/empleador/buscar-candidatos`:

- Filtros por habilidades
- Slider de años de experiencia
- Búsqueda full-text
- Resultados con match score

---

## 💰 Costos Estimados

### Anthropic Claude 3.5 Sonnet

**Pricing:**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

**Estimación por CV:**
- CV promedio: 2 páginas ≈ 1,000 palabras ≈ 1,300 tokens input
- Respuesta JSON: ≈ 500 tokens output
- **Costo por CV: ~$0.006 USD**

**Escala:**
- 100 CVs/mes: **$0.60 USD/mes**
- 1,000 CVs/mes: **$6 USD/mes**
- 10,000 CVs/mes: **$60 USD/mes**

### Alternativa: GPT-4 Turbo

- Input: $10 per 1M tokens
- **Costo por CV: ~$0.015 USD** (2.5x más caro)

### Alternativa: Ollama Local (GRATIS)

Modelos open source como **Llama 3.1 70B**:
- ✅ Gratis
- ❌ Requiere GPU (NVIDIA con 40GB+ VRAM)
- ❌ Infraestructura cara ($500-1000/mes cloud GPU)

**Conclusión:** Claude es más económico hasta ~10K CVs/mes

---

## 🎯 Roadmap de Implementación

### Semana 1: Foundation
- [x] Análisis completado
- [ ] Crear esquema SQL para `cv_metadata`
- [ ] Configurar Anthropic API
- [ ] Estandarizar a solo PDF

### Semana 2: Edge Function
- [ ] Crear Edge Function `parse-cv`
- [ ] Implementar extracción de texto PDF
- [ ] Integrar Claude API
- [ ] Testing con CVs reales

### Semana 3: Integración
- [ ] Trigger automático post-upload
- [ ] Error handling robusto
- [ ] Logs y monitoring
- [ ] Testing E2E

### Semana 4: Features
- [ ] Dashboard de búsqueda
- [ ] Algoritmo de matching
- [ ] Estadísticas y analytics
- [ ] Documentación

---

## 🔐 Consideraciones de Seguridad y Privacidad

### GDPR / Ley de Protección de Datos Personales Chile

**Datos personales sensibles:**
- ✅ Consentimiento explícito (checkbox en formulario)
- ✅ Derecho al olvido (función `deleteCV` existe)
- ⚠️ **IMPLEMENTAR:** Anonimización después de 6 meses
- ⚠️ **IMPLEMENTAR:** Exportación de datos (GDPR Art. 20)

```sql
-- Anonimizar CVs antiguos
UPDATE cv_metadata
SET
  nombre_completo = 'ANONIMIZADO',
  email_extraido = NULL,
  telefono_extraido = NULL,
  texto_completo = NULL
WHERE parsed_at < NOW() - INTERVAL '6 months';
```

### Seguridad de la IA

- ✅ Anthropic no entrena con datos del usuario
- ✅ No se comparten CVs con terceros
- ✅ Storage privado (RLS policies)
- ⚠️ **VALIDAR:** Sanitización antes de enviar a IA

---

## 📚 Referencias

- [Anthropic Claude API Docs](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [PDF.js para parsing](https://github.com/mozilla/pdf.js)
- [Ley 19.628 Chile (Protección Datos)](https://www.bcn.cl/leychile/navegar?idNorma=141599)

---

## ✅ Decisiones Requeridas

**Antes de implementar, decidir:**

1. **¿Qué formatos aceptar?**
   - [ ] Solo PDF (recomendado)
   - [ ] PDF + DOC/DOCX

2. **¿Qué IA usar?**
   - [ ] Claude 3.5 Sonnet (recomendado)
   - [ ] GPT-4 Turbo
   - [ ] Modelo local (Ollama)

3. **¿Cuándo parsear?**
   - [ ] Inmediatamente al subir (Edge Function)
   - [ ] En batch nocturno (más barato)
   - [ ] On-demand al ver postulación

4. **¿Retención de datos?**
   - [ ] Anonimizar después de 6 meses
   - [ ] Eliminar después de 1 año
   - [ ] Mantener indefinidamente (con consentimiento)

---

**Próximo paso:** Revisar este documento y confirmar decisiones técnicas para iniciar implementación.
