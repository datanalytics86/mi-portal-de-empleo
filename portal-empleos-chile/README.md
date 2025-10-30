# Portal de Empleos Georeferenciado - Chile

Plataforma web minimalista para conectar candidatos con ofertas laborales en Chile, con georeferenciación avanzada mediante mapa interactivo.

## 🚀 Características

- ✅ **Cero registros para postulantes** - Solo suben CV
- 🗺️ **Mapa interactivo** con Leaflet y OpenStreetMap
- 📱 **Mobile-first** y responsive
- 🔒 **Seguridad por defecto** con Supabase RLS
- ⚡ **Performance optimizada** con Astro

## 🛠️ Stack Tecnológico

- **Frontend**: Astro 4.x + Tailwind CSS + TypeScript
- **Mapa**: Leaflet 1.9+
- **Backend**: Supabase (PostgreSQL + PostGIS + Storage + Auth)
- **Deployment**: Vercel (frontend) + Supabase Cloud (backend)

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

## 🔧 Comandos Disponibles

| Comando                | Descripción                                     |
| :--------------------- | :---------------------------------------------- |
| `npm run dev`          | Inicia servidor de desarrollo en `localhost:4321` |
| `npm run build`        | Build de producción en `./dist/`                |
| `npm run preview`      | Preview del build de producción localmente      |
| `npm run astro`        | Ejecuta CLI de Astro                            |

## 📁 Estructura del Proyecto

```
/
├── public/              # Assets estáticos
├── src/
│   ├── components/      # Componentes Astro
│   │   └── ui/          # Componentes de UI
│   ├── layouts/         # Layouts de página
│   ├── pages/           # Páginas y rutas
│   │   ├── api/         # API endpoints
│   │   ├── empleador/   # Panel de empleadores
│   │   └── oferta/      # Páginas de ofertas
│   ├── lib/             # Utilidades y configuración
│   └── styles/          # Estilos globales
├── astro.config.mjs     # Configuración de Astro
├── tailwind.config.mjs  # Configuración de Tailwind
└── tsconfig.json        # Configuración de TypeScript
```

## 🔑 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PUBLIC_SUPABASE_URL=tu_url_de_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_MAX_CV_SIZE=5242880
```

## 📖 Documentación

Para más detalles sobre la implementación, consulta:
- `SPECIFICATIONS.md` - Especificaciones completas del proyecto
- `ARCHITECTURE.md` - Arquitectura del sistema

## 🚢 Deployment

Ver instrucciones detalladas en `SPECIFICATIONS.md` sección 13.

## 📄 Licencia

ISC
