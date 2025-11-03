# Portal de Empleo Chile 🇨🇱

Plataforma web minimalista para conectar candidatos con ofertas laborales en Chile. El diferenciador clave es la experiencia sin fricción: **cero registros para postulantes** (solo suben CV) y **georeferenciación avanzada** mediante mapa interactivo.

## 🚀 Características

### Para Candidatos
- ✅ **Sin registro**: Postula solo subiendo tu CV
- 🗺️ **Mapa interactivo**: Encuentra ofertas cerca de ti
- 🔍 **Búsqueda avanzada**: Filtra por comuna, tipo de jornada y categoría
- 📱 **100% Responsive**: Diseñado mobile-first

### Para Empleadores
- 📝 Publicación gratuita de ofertas
- 👥 Gestión completa de postulaciones
- 📊 Dashboard con estadísticas
- 🔐 Sistema de autenticación seguro

## 🛠️ Stack Tecnológico

- **Frontend**: Astro 4.x + Tailwind CSS + TypeScript
- **Mapa**: Leaflet 1.9+ con tiles de OpenStreetMap
- **Backend**: Supabase (PostgreSQL + PostGIS + Storage + Auth)
- **Deployment**: Vercel (frontend) + Supabase Cloud (backend)
- **Validación**: Zod para schemas

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase (gratuita)
- Cuenta de Vercel (gratuita, opcional para deployment)

## ⚙️ Instalación Local

### 1. Clonar el repositorio

\`\`\`bash
git clone https://github.com/datanalytics86/mi-portal-de-empleo.git
cd mi-portal-de-empleo
\`\`\`

### 2. Instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)

2. Ejecuta el siguiente script SQL en el SQL Editor de Supabase:

\`\`\`sql
-- Extensión para georeferenciación
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tabla de empleadores
CREATE TABLE empleadores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  categoria TEXT,
  comuna TEXT NOT NULL,
  ubicacion GEOGRAPHY(POINT, 4326),
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

-- Índice espacial
CREATE INDEX idx_ofertas_ubicacion ON ofertas USING GIST(ubicacion);

-- Tabla de postulaciones
CREATE TABLE postulaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_id UUID REFERENCES ofertas(id) ON DELETE CASCADE,
  nombre_candidato TEXT,
  email_candidato TEXT,
  cv_url TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para prevenir duplicados
CREATE INDEX idx_postulaciones_oferta_email ON postulaciones(oferta_id, email_candidato);

-- Row Level Security
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ofertas son públicas" ON ofertas
  FOR SELECT USING (activa = TRUE);

CREATE POLICY "Empleadores gestionan sus ofertas" ON ofertas
  FOR ALL USING (auth.uid() = empleador_id);

ALTER TABLE postulaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empleadores ven sus postulaciones" ON postulaciones
  FOR SELECT USING (
    oferta_id IN (SELECT id FROM ofertas WHERE empleador_id = auth.uid())
  );

CREATE POLICY "Cualquiera puede crear postulaciones" ON postulaciones
  FOR INSERT WITH CHECK (true);
\`\`\`

3. Crea un Storage Bucket llamado `cvs`:
   - Ve a Storage en Supabase
   - Crea un nuevo bucket llamado "cvs"
   - Configúralo como privado
   - Max file size: 5MB
   - Allowed MIME types: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

4. Aplica las Storage Policies:

\`\`\`sql
-- Permitir upload de CVs
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
\`\`\`

### 4. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

\`\`\`bash
cp .env.example .env
\`\`\`

Edita `.env` con tus credenciales de Supabase:

\`\`\`env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_MAX_CV_SIZE=5242880
\`\`\`

> 💡 Encuentra tus keys en: Supabase Dashboard → Settings → API

### 5. Iniciar el servidor de desarrollo

\`\`\`bash
npm run dev
\`\`\`

Visita [http://localhost:4321](http://localhost:4321)

## 📁 Estructura del Proyecto

\`\`\`
/
├── src/
│   ├── components/
│   │   ├── ui/                      # Componentes UI reutilizables
│   │   ├── OfertaCard.astro         # Tarjeta de oferta
│   │   ├── MapaOfertas.astro        # Mapa Leaflet
│   │   ├── FormularioPostulacion.astro
│   │   └── FiltrosBusqueda.astro
│   ├── layouts/
│   │   └── Layout.astro             # Layout base
│   ├── pages/
│   │   ├── index.astro              # Home
│   │   ├── oferta/[id].astro        # Detalle de oferta
│   │   ├── empleador/               # Páginas de empleadores
│   │   └── api/                     # API routes
│   ├── lib/
│   │   ├── supabase.ts              # Cliente Supabase
│   │   ├── comunas.ts               # Datos de comunas chilenas
│   │   └── validations.ts           # Schemas Zod
│   └── styles/
│       └── global.css
├── public/
├── .env.example
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
\`\`\`

## 🚢 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel Dashboard
3. Deploy automático en cada push

### Manual

\`\`\`bash
npm run build
npm run preview
\`\`\`

## 🧪 Scripts Disponibles

- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build de producción

## 🔐 Seguridad

- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Validación de archivos (tipo y tamaño)
- ✅ Rate limiting (3 postulaciones/hora por IP)
- ✅ Storage privado con políticas de acceso
- ✅ Validación de esquemas con Zod
- ✅ HTTPS en producción

## 📊 Base de Datos

### Tablas Principales

- **empleadores**: Información de empresas registradas
- **ofertas**: Ofertas laborales con georeferenciación
- **postulaciones**: CVs y datos de candidatos

### Tipos de Jornada

- Full-time
- Part-time
- Freelance
- Práctica

### Categorías Disponibles

Tecnología, Ventas, Administración, Marketing, Diseño, Recursos Humanos, Finanzas, Logística, Educación, Salud, Construcción, Turismo, Gastronomía, Servicio al Cliente, Producción, Otro

## 🗺️ Comunas Incluidas

El sistema incluye 200+ comunas de todas las regiones de Chile con sus coordenadas geográficas para el mapa interactivo.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 📧 Contacto

Para consultas o soporte, abre un issue en GitHub.

---

Hecho con ❤️ en Chile
