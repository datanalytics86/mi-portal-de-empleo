# Plataforma de Empleos Georeferenciada - Chile

## 1. CONTEXTO Y OBJETIVO

Desarrollar una plataforma web minimalista para conectar candidatos con ofertas laborales en Chile. El diferenciador clave es la experiencia sin fricción: **cero registros para postulantes** (solo suben CV) y **georeferenciación avanzada** mediante mapa interactivo.

**Principios de diseño:**
- Minimalismo visual y funcional
- Mobile-first y responsive
- Escalable desde el día 1
- Seguridad y privacidad por defecto

---

## 2. STACK TECNOLÓGICO

- **Frontend**: Astro 4.x + Tailwind CSS + TypeScript
- **Mapa**: Leaflet 1.9+ con tiles de OpenStreetMap
- **Backend**: Supabase (PostgreSQL + PostGIS + Storage + Auth)
- **Deployment**: Vercel (frontend) + Supabase Cloud (backend)
- **Validación**: Zod para schemas
- **Iconos**: Lucide React o Heroicons

---

## 3. ARQUITECTURA DE BASE DE DATOS

### Schema Supabase (PostgreSQL + PostGIS):

```sql
-- Extensión para georeferenciación
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tabla de empleadores
CREATE TABLE empleadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre_empresa TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de ofertas
CREATE TABLE ofertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleador_id UUID REFERENCES empleadores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  empresa TEXT NOT NULL,
  tipo_jornada TEXT NOT NULL CHECK (tipo_jornada IN ('Full-time', 'Part-time', 'Freelance', 'Práctica')),
  categoria TEXT, -- Ej: 'Tecnología', 'Ventas', 'Administración'
  comuna TEXT NOT NULL,
  ubicacion GEOGRAPHY(POINT, 4326), -- lat/lng en formato PostGIS
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

-- Índice espacial para búsquedas geográficas
CREATE INDEX idx_ofertas_ubicacion ON ofertas USING GIST(ubicacion);

-- Tabla de postulaciones
CREATE TABLE postulaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id UUID REFERENCES ofertas(id) ON DELETE CASCADE,
  nombre_candidato TEXT,
  email_candidato TEXT,
  cv_url TEXT NOT NULL,
  ip_address INET, -- Para anti-spam
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para prevenir duplicados
CREATE INDEX idx_postulaciones_oferta_email ON postulaciones(oferta_id, email_candidato);
```

### Row Level Security (RLS):

```sql
-- Ofertas: públicas para lectura, solo empleador propietario puede modificar
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ofertas son públicas" ON ofertas
  FOR SELECT USING (activa = TRUE);

CREATE POLICY "Empleadores gestionan sus ofertas" ON ofertas
  FOR ALL USING (auth.uid() = empleador_id);

-- Postulaciones: solo empleador propietario puede ver
ALTER TABLE postulaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empleadores ven sus postulaciones" ON postulaciones
  FOR SELECT USING (
    oferta_id IN (SELECT id FROM ofertas WHERE empleador_id = auth.uid())
  );
```

---

## 4. ESTRUCTURA DEL PROYECTO

```
/
├── src/
│   ├── components/
│   │   ├── OfertaCard.astro          # Tarjeta de oferta
│   │   ├── MapaOfertas.astro         # Mapa Leaflet
│   │   ├── FormularioPostulacion.astro # Form para subir CV
│   │   ├── FiltrosBusqueda.astro     # Barra búsqueda + filtros
│   │   └── ui/                        # Botones, inputs, etc.
│   ├── layouts/
│   │   └── Layout.astro               # Layout base
│   ├── pages/
│   │   ├── index.astro                # Home (mapa + lista ofertas)
│   │   ├── oferta/[id].astro          # Detalle de oferta
│   │   ├── empleador/
│   │   │   ├── login.astro
│   │   │   ├── registro.astro
│   │   │   ├── dashboard.astro        # Lista de ofertas del empleador
│   │   │   └── oferta/nueva.astro     # Crear oferta
│   │   └── api/
│   │       ├── postular.ts            # POST: subir CV y crear postulación
│   │       ├── ofertas.ts             # GET: filtrar ofertas
│   │       └── upload-cv.ts           # Upload a Supabase Storage
│   ├── lib/
│   │   ├── supabase.ts                # Cliente Supabase
│   │   ├── comunas.ts                 # Lista de comunas chilenas con lat/lng
│   │   └── validations.ts             # Schemas Zod
│   └── styles/
│       └── global.css                 # Estilos Tailwind
├── public/
├── .env.example
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

---

## 5. FUNCIONALIDADES MVP

### 5.1 Para Candidatos (Sin Registro)

#### Página Home (`/`)
- **Mapa interactivo** (Leaflet):
  - Centrado en Santiago de Chile (lat: -33.4489, lng: -70.6693)
  - Marcadores por cada oferta activa
  - Cluster para ofertas cercanas
  - Popup al hacer click: título + empresa + botón "Ver detalles"

- **Lista de ofertas** (grid responsive):
  - Tarjetas con: título, empresa, comuna, tipo de jornada, fecha publicación
  - Scroll infinito o paginación

- **Barra de búsqueda y filtros**:
  - Búsqueda por texto (título/empresa)
  - Filtro por tipo de jornada (multi-select)
  - Filtro por comuna (dropdown con todas las comunas de Chile)

#### Página Detalle de Oferta (`/oferta/[id]`)
- Información completa: título, empresa, descripción, tipo de jornada, comuna, fecha
- Mapa pequeño mostrando ubicación específica
- **Formulario de postulación**:
  - Nombre (opcional, text input)
  - Email (opcional, email input)
  - CV (requerido, file input - solo PDF/Word, max 5MB)
  - Checkbox: "Acepto la política de privacidad" (obligatorio)
  - Botón: "Enviar postulación"
  - Validaciones en tiempo real
  - Mensaje de éxito tras envío

### 5.2 Para Empleadores (Con Registro)

#### Registro y Login (`/empleador/registro` y `/empleador/login`)
- Email + contraseña (Supabase Auth)
- Nombre de empresa
- Validación de email

#### Dashboard (`/empleador/dashboard`)
- Listado de ofertas del empleador (tabla)
- Por cada oferta: título, fecha publicación, # postulaciones, estado (activa/expirada)
- Botones: "Ver postulaciones", "Editar", "Desactivar"
- Botón: "+ Nueva oferta"

#### Crear Oferta (`/empleador/oferta/nueva`)
- Formulario:
  - Título (text, requerido)
  - Descripción (textarea, requerido, max 2000 caracteres)
  - Empresa (text, pre-llenado, editable)
  - Tipo de jornada (select: Full-time, Part-time, Freelance, Práctica)
  - Categoría (select: Tecnología, Ventas, Administración, etc.)
  - Comuna (select con todas las comunas, requerido)
  - Fecha de expiración (date input, default: 30 días)
- Auto-conversión de comuna a lat/lng usando tabla de referencia
- Botón: "Publicar oferta"

#### Ver Postulaciones (`/empleador/dashboard/oferta/[id]/postulaciones`)
- Tabla con: nombre candidato, email, fecha postulación
- Botón "Descargar CV" por cada postulación (link a Supabase Storage)

---

## 6. DISEÑO UI/UX

### 6.1 Sistema de Diseño

**Paleta de colores:**
```css
:root {
  --color-background: #FFFFFF;
  --color-surface: #F7FAFC;
  --color-text-primary: #1A202C;
  --color-text-secondary: #718096;
  --color-accent: #4299E1;
  --color-accent-hover: #3182CE;
  --color-error: #E53E3E;
  --color-success: #38A169;
  --color-border: #E2E8F0;
}
```

**Tipografía:**
- Font family: Inter (Google Fonts)
- Body: 16px / 1.6 line-height
- Títulos: 24px-32px, font-weight: 600
- Subtítulos: 18px-20px, font-weight: 500

**Espaciado:**
- Usar escala de Tailwind: p-4, m-6, gap-8, etc.
- Contenedores: max-width: 1280px (container)
- Margen lateral: px-4 (mobile), px-8 (desktop)

### 6.2 Componentes Clave

#### Tarjeta de Oferta
```html
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
  <h3 class="text-xl font-semibold text-gray-900">{titulo}</h3>
  <p class="text-gray-600 mt-1">{empresa}</p>
  <div class="flex items-center gap-4 mt-3 text-sm text-gray-500">
    <span>📍 {comuna}</span>
    <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded">{tipo_jornada}</span>
  </div>
  <p class="text-sm text-gray-400 mt-3">{fecha_relativa}</p>
</div>
```

#### Formulario de Postulación
- Input de archivo con drag & drop visual
- Preview del archivo seleccionado
- Validación en tiempo real (tipo de archivo, tamaño)
- Estados: default, loading, success, error

#### Mapa
- Alto: 400px (mobile), 500px (desktop)
- Controles de zoom visibles
- Marcadores: icono azul personalizado
- Popup con sombra y borde redondeado

---

## 7. DATOS DE REFERENCIA: COMUNAS DE CHILE

Crear archivo `/src/lib/comunas.ts` con array de ~316 comunas chilenas:

```typescript
export const comunasChile = [
  { nombre: 'Santiago', region: 'Metropolitana', lat: -33.4489, lng: -70.6693 },
  { nombre: 'Valparaíso', region: 'Valparaíso', lat: -33.0472, lng: -71.6127 },
  { nombre: 'Concepción', region: 'Biobío', lat: -36.8201, lng: -73.0444 },
  { nombre: 'La Serena', region: 'Coquimbo', lat: -29.9027, lng: -71.2519 },
  { nombre: 'Antofagasta', region: 'Antofagasta', lat: -23.6509, lng: -70.3975 },
  { nombre: 'Temuco', region: 'Araucanía', lat: -38.7359, lng: -72.5904 },
  { nombre: 'Rancagua', region: "O'Higgins", lat: -34.1708, lng: -70.7407 },
  { nombre: 'Talca', region: 'Maule', lat: -35.4264, lng: -71.6554 },
  { nombre: 'Arica', region: 'Arica y Parinacota', lat: -18.4746, lng: -70.2979 },
  { nombre: 'Puerto Montt', region: 'Los Lagos', lat: -41.4693, lng: -72.9424 },
  { nombre: 'Iquique', region: 'Tarapacá', lat: -20.2307, lng: -70.1435 },
  { nombre: 'Coyhaique', region: 'Aysén', lat: -45.5752, lng: -72.0662 },
  { nombre: 'Punta Arenas', region: 'Magallanes', lat: -53.1638, lng: -70.9171 },
  { nombre: 'Valdivia', region: 'Los Ríos', lat: -39.8142, lng: -73.2459 },
  { nombre: 'Osorno', region: 'Los Lagos', lat: -40.5736, lng: -73.1322 },
  { nombre: 'Copiapó', region: 'Atacama', lat: -27.3668, lng: -70.3323 },
  { nombre: 'Chillán', region: 'Ñuble', lat: -36.6066, lng: -72.1034 },
  { nombre: 'Quilpué', region: 'Valparaíso', lat: -33.0472, lng: -71.4419 },
  { nombre: 'Los Ángeles', region: 'Biobío', lat: -37.4689, lng: -72.3527 },
  { nombre: 'Curicó', region: 'Maule', lat: -34.9830, lng: -71.2394 },
  // ... agregar las 316 comunas completas
];
```

*Nota: Incluir lista completa de comunas en el código final.*

---

## 8. SEGURIDAD Y VALIDACIONES

### 8.1 Validación de Archivos (CV)

**Cliente (Astro component):**
```typescript
const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const maxSize = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): string | null {
  if (!allowedTypes.includes(file.type)) {
    return 'Solo se aceptan archivos PDF o Word';
  }
  if (file.size > maxSize) {
    return 'El archivo no puede superar 5MB';
  }
  return null;
}
```

**Servidor (API route):**
- Re-validar tipo MIME
- Escanear extensión real del archivo (no confiar en metadata)
- Generar nombre único: `{timestamp}_{random_uuid}.pdf`

### 8.2 Rate Limiting

**Anti-spam de postulaciones:**
- Máximo 3 postulaciones por IP por hora
- Almacenar IP en tabla `postulaciones`
- Validar en API route antes de guardar

```typescript
// Pseudo-código
const recentPostulations = await supabase
  .from('postulaciones')
  .select('id')
  .eq('ip_address', userIP)
  .gte('created_at', new Date(Date.now() - 3600000)); // última hora

if (recentPostulations.length >= 3) {
  return { error: 'Has alcanzado el límite de postulaciones por hora' };
}
```

### 8.3 Privacidad

- **Aviso de privacidad**: Link en footer y en formulario de postulación
- **Retención de datos**: Cronjob (Supabase Function) para eliminar CVs y postulaciones después de 90 días
- **Consentimiento explícito**: Checkbox obligatorio en formulario

---

## 9. CONFIGURACIÓN DE SUPABASE

### 9.1 Storage Bucket

```typescript
// Crear bucket "cvs" (público para descarga, privado para upload)
{
  name: 'cvs',
  public: false, // Solo empleador propietario puede descargar
  fileSizeLimit: 5242880, // 5MB
  allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}
```

### 9.2 Storage Policies

```sql
-- Cualquiera puede subir (se valida en API route)
CREATE POLICY "Permitir upload de CVs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cvs');

-- Solo empleador propietario puede descargar
CREATE POLICY "Empleadores descargan CVs de sus ofertas" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cvs' AND
    auth.uid() IN (
      SELECT o.empleador_id FROM ofertas o
      JOIN postulaciones p ON p.oferta_id = o.id
      WHERE p.cv_url = name
    )
  );
```

---

## 10. VARIABLES DE ENTORNO

Crear archivo `.env.example`:

```env
# Supabase
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Solo para servidor

# Configuración
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_MAX_CV_SIZE=5242880
```

---

## 11. FLUJOS DE USUARIO

### Flujo Candidato:
1. Entra a `/` → ve mapa y lista de ofertas
2. Filtra por comuna o busca por texto
3. Click en oferta → redirige a `/oferta/[id]`
4. Lee descripción, ve ubicación en mapa
5. Completa formulario: nombre (opcional), email (opcional), sube CV
6. Acepta checkbox de privacidad
7. Click "Enviar postulación"
8. Ve mensaje de éxito: "✅ Postulación enviada correctamente"

### Flujo Empleador:
1. Va a `/empleador/login` o `/empleador/registro`
2. Se registra con email + contraseña + nombre empresa
3. Redirige a `/empleador/dashboard`
4. Click "+ Nueva oferta"
5. Completa formulario: título, descripción, comuna, tipo de jornada, etc.
6. Click "Publicar oferta"
7. Oferta aparece en mapa y lista pública
8. Ve postulaciones en dashboard, descarga CVs

---

## 12. CONFIGURACIÓN DE LEAFLET

### Instalación:
```bash
npm install leaflet
npm install -D @types/leaflet
```

### Implementación en Astro:

```astro
---
// src/components/MapaOfertas.astro
import 'leaflet/dist/leaflet.css';

interface Props {
  ofertas: Array<{
    id: string;
    titulo: string;
    empresa: string;
    lat: number;
    lng: number;
  }>;
}

const { ofertas } = Astro.props;
---

<div id="mapa" class="h-[400px] md:h-[500px] rounded-lg shadow-sm"></div>

<script define:vars={{ ofertas }}>
  import L from 'leaflet';

  // Fix para iconos de Leaflet
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  const mapa = L.map('mapa').setView([-33.4489, -70.6693], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapa);

  ofertas.forEach(oferta => {
    const marker = L.marker([oferta.lat, oferta.lng]).addTo(mapa);
    marker.bindPopup(`
      <div class="p-2">
        <h4 class="font-semibold">${oferta.titulo}</h4>
        <p class="text-sm text-gray-600">${oferta.empresa}</p>
        <a href="/oferta/${oferta.id}" class="text-blue-600 text-sm">Ver detalles →</a>
      </div>
    `);
  });
</script>
```

---

## 13. DEPLOYMENT

### Vercel (Frontend):
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Variables de entorno en Vercel dashboard:
# PUBLIC_SUPABASE_URL
# PUBLIC_SUPABASE_ANON_KEY
# PUBLIC_SITE_URL
```

### Supabase:
1. Crear proyecto en supabase.com
2. Ejecutar SQL schema (sección 3)
3. Crear bucket "cvs" (sección 9.1)
4. Aplicar Storage Policies (sección 9.2)
5. Configurar Auth providers (Email/Password)
6. Copiar URL y Anon Key a variables de entorno

---

## 14. TESTING Y VALIDACIÓN

### Checklist pre-lanzamiento:
- [ ] Candidato puede postular sin registro en <60 segundos
- [ ] Mapa carga en <2 segundos con 100+ ofertas
- [ ] Formulario valida archivos correctamente (tipo y tamaño)
- [ ] Rate limiting funciona (máx 3 postulaciones/hora)
- [ ] Empleador puede crear oferta en <3 minutos
- [ ] RLS policies impiden acceso no autorizado a CVs
- [ ] Responsive en mobile (iPhone SE), tablet (iPad), desktop (1920px)
- [ ] Todos los links funcionan (no 404)
- [ ] Formularios muestran errores claros
- [ ] HTTPS habilitado
- [ ] Aviso de privacidad visible

---

## 15. ROADMAP POST-MVP (Fase 2)

- Geolocalización del usuario (GPS + filtro por radio de distancia)
- Búsqueda full-text con Meilisearch o Algolia
- Emails automáticos (confirmación postulación, notificación empleador)
- Dashboard empleador avanzado (estadísticas, gráficos)
- Edición de ofertas
- Sistema de categorías/etiquetas
- Moderación de ofertas (admin panel)
- Exportación de CVs en batch (zip)
- Integración con LinkedIn (auto-fill perfil)
- Modo oscuro

---

## 16. CRITERIOS DE ÉXITO

**Métricas clave:**
- Time to First Postulation (TTFP): <60 segundos
- Tasa de conversión: >30% (visitantes que postulan)
- Tasa de rebote: <40%
- Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1
- Disponibilidad: >99.5% uptime

**KPIs de negocio:**
- Número de ofertas publicadas/semana
- Número de postulaciones/oferta (promedio)
- Retención de empleadores (publican >1 oferta)

---

## 17. DOCUMENTACIÓN A GENERAR

1. **README.md**:
   - Descripción del proyecto
   - Instrucciones de instalación local
   - Variables de entorno requeridas
   - Comandos npm (dev, build, preview)
   - Estructura de carpetas

2. **DEPLOYMENT.md**:
   - Guía paso a paso para Vercel
   - Configuración de Supabase
   - Troubleshooting común

3. **CONTRIBUTING.md** (si es open-source):
   - Guía para contribuidores
   - Estándares de código
   - Proceso de PR

---

## 18. NOTAS FINALES

- **Prioridad 1**: Funcionalidad (postulación sin fricción, mapa básico)
- **Prioridad 2**: UX (diseño limpio, feedback claro)
- **Prioridad 3**: Performance (lazy loading, optimización de imágenes)
- **Prioridad 4**: Features adicionales (búsqueda avanzada, notificaciones)

**Filosofía de desarrollo**: Shipping beats perfection. Lanza MVP rápido, itera basándote en feedback real.

---

¿Listo para comenzar? Empieza con:
1. Setup de proyecto Astro + Tailwind
2. Configuración de Supabase (schema + bucket)
3. Implementación de página home con mapa básico
4. Formulario de postulación con upload a Storage
