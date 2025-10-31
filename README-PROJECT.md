# Portal de Empleos Georeferenciado - Chile 🇨🇱

Plataforma web minimalista para conectar candidatos con ofertas laborales en Chile, con georeferenciación avanzada mediante mapa interactivo Leaflet y OpenStreetMap.

## ✨ Características Principales

### Para Candidatos (Sin Registro)
- 🗺️ **Mapa Interactivo** - Visualiza ofertas en mapa con coordenadas exactas
- 🔍 **Búsqueda y Filtros** - Por título, empresa, tipo de jornada y categoría
- 📄 **Postulación Simple** - Solo sube tu CV (PDF/Word, max 5MB)
- 🚫 **Sin Registro** - Postula en menos de 60 segundos
- 🔒 **Privacidad** - Datos opcionales (nombre y email)

### Para Empleadores (Con Registro)
- 📊 **Dashboard Completo** - Estadísticas y gestión de ofertas
- ➕ **Crear Ofertas** - Formulario intuitivo con georeferenciación automática
- 👥 **Ver Postulaciones** - Lista de candidatos con descarga de CVs
- 🔄 **Activar/Desactivar** - Control total sobre tus publicaciones
- 📍 **150+ Comunas** - Cobertura de todas las regiones de Chile

### Características Técnicas
- ⚡ **SSR con Astro** - Renderizado del lado del servidor para mejor performance
- 🔐 **Autenticación Segura** - Supabase Auth con sesiones HTTP-only
- 🛡️ **Row Level Security** - Políticas RLS para protección de datos
- 🗃️ **PostGIS** - Queries geoespaciales eficientes
- 📦 **Supabase Storage** - Almacenamiento seguro de CVs
- 🚦 **Rate Limiting** - Máximo 3 postulaciones por hora por IP
- 📱 **Mobile First** - Diseño responsive para todos los dispositivos

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| **Framework** | Astro 5.x (SSR mode) |
| **Estilos** | Tailwind CSS 3.x |
| **Lenguaje** | TypeScript (strict mode) |
| **Mapa** | Leaflet 1.9.4 + OpenStreetMap |
| **Backend** | Supabase (PostgreSQL + PostGIS + Storage + Auth) |
| **Validación** | Zod 3.x |
| **Adapter** | @astrojs/node (standalone) |
| **Deployment** | Node.js server / Vercel / Railway |

## 📦 Instalación

### Prerrequisitos

- Node.js 18+
- npm o pnpm
- Cuenta en [Supabase](https://supabase.com) (gratis)

### Paso 1: Clonar el repositorio

```bash
git clone <repository-url>
cd portal-empleos-chile
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. En el dashboard de Supabase, ve a **SQL Editor**
3. Ejecuta el script `supabase-schema.sql` (incluido en el proyecto)
4. Esto creará:
   - Tablas: `empleadores`, `ofertas`, `postulaciones`
   - Extensión PostGIS para geolocalización
   - Políticas RLS para seguridad
   - Bucket de Storage `cvs` para CVs

### Paso 4: Variables de Entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Site Configuration
PUBLIC_SITE_URL=http://localhost:4321
```

**Dónde encontrar las keys:**
- Ve a tu proyecto en Supabase
- Settings → API
- Copia `URL`, `anon public` key y `service_role` key

### Paso 5: Iniciar desarrollo

```bash
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321) en tu navegador.

## 🔧 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo en `localhost:4321` |
| `npm run build` | Build de producción en `./dist/` |
| `npm run preview` | Preview del build de producción |
| `npm run astro` | Ejecuta CLI de Astro |

## 📁 Estructura del Proyecto

```
portal-empleos-chile/
├── public/                     # Assets estáticos
├── src/
│   ├── components/            # Componentes Astro reutilizables
│   │   ├── FormularioPostulacion.astro
│   │   ├── MapaOfertas.astro
│   │   └── OfertaCard.astro
│   ├── layouts/
│   │   └── Layout.astro       # Layout base con header/footer
│   ├── pages/
│   │   ├── index.astro        # Home con mapa y lista de ofertas
│   │   ├── oferta/
│   │   │   └── [id].astro     # Detalle de oferta + formulario
│   │   ├── privacidad.astro   # Política de privacidad
│   │   ├── empleador/
│   │   │   ├── login.astro    # Login empleadores
│   │   │   ├── registro.astro # Registro empleadores
│   │   │   ├── dashboard.astro # Dashboard con tabla de ofertas
│   │   │   └── oferta/
│   │   │       ├── nueva.astro           # Crear oferta
│   │   │       └── [id]/postulaciones.astro # Ver postulaciones
│   │   └── api/
│   │       ├── postular.ts              # Subir CV y crear postulación
│   │       ├── auth/
│   │       │   ├── login.ts             # API login
│   │       │   ├── registro.ts          # API registro
│   │       │   └── logout.ts            # API logout
│   │       └── ofertas/
│   │           ├── crear.ts             # API crear oferta
│   │           └── [id]/
│   │               ├── toggle.ts        # Activar/desactivar oferta
│   │               └── cv-download.ts   # Generar URL firmada para CV
│   ├── lib/
│   │   ├── supabase.ts        # Cliente Supabase (público y servidor)
│   │   ├── auth.ts            # Helpers de autenticación
│   │   ├── comunas.ts         # 150+ comunas de Chile con coordenadas
│   │   └── validations.ts     # Schemas Zod y validaciones
│   ├── styles/
│   │   └── global.css         # Estilos globales + Tailwind
│   └── middleware.ts          # Middleware para rutas protegidas
├── astro.config.mjs           # Configuración Astro (SSR + Node adapter)
├── tailwind.config.mjs        # Configuración Tailwind (colores custom)
├── tsconfig.json              # TypeScript strict mode
├── supabase-schema.sql        # Script SQL para setup de DB
├── SPECIFICATIONS.md          # Especificaciones completas
└── ARCHITECTURE.md            # Documentación de arquitectura
```

## 🗄️ Base de Datos

### Tablas Principales

**empleadores**
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `nombre_empresa` (TEXT)
- `created_at` (TIMESTAMP)

**ofertas**
- `id` (UUID, PK)
- `empleador_id` (UUID, FK → empleadores)
- `titulo` (TEXT)
- `descripcion` (TEXT)
- `empresa` (TEXT)
- `tipo_jornada` (ENUM: Full-time, Part-time, Freelance, Práctica)
- `categoria` (TEXT, nullable)
- `comuna` (TEXT)
- `ubicacion` (GEOGRAPHY POINT - PostGIS)
- `activa` (BOOLEAN, default true)
- `created_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP, default +30 días)

**postulaciones**
- `id` (UUID, PK)
- `oferta_id` (UUID, FK → ofertas)
- `nombre_candidato` (TEXT, nullable)
- `email_candidato` (TEXT, nullable)
- `cv_url` (TEXT) - Path en Supabase Storage
- `ip_address` (TEXT) - Para rate limiting
- `created_at` (TIMESTAMP)

### Storage

**Bucket: cvs**
- Privado (solo empleadores pueden descargar)
- Max file size: 5MB
- Tipos permitidos: PDF, DOC, DOCX
- Estructura: `{oferta_id}/{timestamp}_{uuid}_{filename}`

## 🔐 Seguridad

### Row Level Security (RLS)

✅ **Ofertas**: Públicas para lectura (activas), solo empleador propietario puede modificar
✅ **Postulaciones**: Solo empleador propietario de la oferta puede leer
✅ **Storage CVs**: Solo empleador propietario puede descargar

### Rate Limiting

- Máximo 3 postulaciones por IP por hora
- Implementado en `/api/postular.ts`

### Autenticación

- Sesiones con cookies HTTP-only
- Tokens en Supabase Auth
- Middleware protege rutas `/empleador/*`

## 🚀 Deployment

### Opción 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Variables de entorno en Vercel:**
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Añade todas las variables de `.env`

### Opción 2: Railway

1. Conecta tu repositorio en [Railway](https://railway.app)
2. Añade las variables de entorno
3. Railway detectará Astro automáticamente

### Opción 3: VPS (Node.js)

```bash
# Build
npm run build

# El build genera:
# - dist/ (archivos estáticos)
# - dist/server/ (servidor Node.js)

# Iniciar servidor
node dist/server/entry.mjs

# O usar PM2
pm2 start dist/server/entry.mjs --name "portal-empleos"
```

**Requisitos VPS:**
- Node.js 18+
- Puerto configurado (default: 4321)
- Variables de entorno configuradas

## 🧪 Testing

### Build de Producción (Local)

```bash
npm run build
npm run preview
```

### Checklist Pre-Lanzamiento

- [ ] Supabase configurado y script SQL ejecutado
- [ ] Todas las variables de entorno configuradas
- [ ] Build exitoso sin errores TypeScript
- [ ] Candidato puede postular sin registro
- [ ] Empleador puede crear oferta y ver postulaciones
- [ ] Mapa carga correctamente con ofertas
- [ ] Descarga de CVs funciona
- [ ] Responsive en mobile (probado en iPhone SE)
- [ ] RLS policies activas en Supabase

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"

**Solución:** Verifica que `.env` existe y tiene las 3 variables requeridas:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Error: "PostGIS extension not found"

**Solución:** Ejecuta en Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Mapa no carga o muestra tiles en blanco

**Solución:** Verifica que Leaflet CSS está importado en `Layout.astro`:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

### Error 403 al subir CV

**Solución:** Verifica políticas de Storage en Supabase:
1. Dashboard → Storage → Policies
2. Debe existir política `"Permitir upload de CVs"` para bucket `cvs`

### Build falla en producción

**Solución:** Asegúrate de que `astro.config.mjs` tiene:
```javascript
output: 'server',
adapter: node({ mode: 'standalone' })
```

## 📚 Documentación Adicional

- **SPECIFICATIONS.md** - Especificaciones completas del proyecto
- **ARCHITECTURE.md** - Arquitectura y decisiones técnicas
- **SUPABASE_SETUP.md** - Guía detallada de configuración de Supabase
- **supabase-schema.sql** - Script SQL completo para la base de datos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Roadmap Post-MVP

- [ ] Geolocalización del usuario (GPS + filtro por radio)
- [ ] Búsqueda full-text con Algolia/Meilisearch
- [ ] Emails automáticos (confirmación postulación)
- [ ] Dashboard empleador avanzado (estadísticas, gráficos)
- [ ] Edición de ofertas
- [ ] Sistema de categorías/tags
- [ ] Exportación de CVs en batch (ZIP)
- [ ] Integración con LinkedIn

## 📄 Licencia

ISC License - Ver archivo LICENSE para más detalles

## 👨‍💻 Autor

Desarrollado siguiendo las especificaciones de **SPECIFICATIONS.md**

---

**Stack:** Astro + Supabase + Tailwind CSS + Leaflet
**Deployment:** Ready for Vercel, Railway o VPS
**Status:** ✅ MVP Completo y Funcional
