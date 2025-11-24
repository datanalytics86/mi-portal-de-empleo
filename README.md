# 🇨🇱 Portal de Empleo Chile

[![CI/CD](https://github.com/datanalytics86/mi-portal-de-empleo/actions/workflows/ci.yml/badge.svg)](https://github.com/datanalytics86/mi-portal-de-empleo/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Plataforma de empleos georeferenciada para Chile. Conecta candidatos con oportunidades laborales mediante mapas interactivos **sin fricciones ni registros obligatorios**.

---

## ✨ Características Principales

### Para Candidatos
- 🗺️ **Mapa interactivo** con ofertas georeferenciadas (Leaflet + OpenStreetMap)
- 🔍 **Búsqueda y filtros** por comuna, tipo de jornada y categoría
- 📄 **Postulación sin registro** - solo sube tu CV
- 📱 **Mobile-first** y completamente responsive
- ⚡ **Ultra rápido** - optimizado para Core Web Vitals

### Para Empleadores
- 🔐 **Dashboard privado** con autenticación segura
- ➕ **Publica ofertas** con georeferenciación automática
- 📊 **Gestiona postulaciones** y descarga CVs
- 🔔 **Notificaciones** de nuevas postulaciones (próximamente)

---

## 🏗️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | Astro 4.x + Tailwind CSS + TypeScript |
| **Mapa** | Leaflet 1.9 + OpenStreetMap |
| **Backend** | Supabase (PostgreSQL + PostGIS + Auth + Storage) |
| **Deployment** | Vercel (frontend) + Supabase Cloud (backend) |
| **Validación** | Zod + DOMPurify |
| **Testing** | Vitest |
| **CI/CD** | GitHub Actions |

---

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com) (opcional, para deployment)

### Instalación Local

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/datanalytics86/mi-portal-de-empleo.git
   cd mi-portal-de-empleo
   ```

2. **Instala dependencias**:
   ```bash
   npm install
   ```

3. **Configura variables de entorno**:
   ```bash
   cp .env.example .env
   ```

   Edita `.env` con tus credenciales de Supabase:
   ```env
   PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   ```

4. **Configura la base de datos**:
   - Ve a tu proyecto en [Supabase](https://app.supabase.com)
   - Abre el SQL Editor
   - Ejecuta el script `database/schema.sql`

5. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

   Abre [http://localhost:4321](http://localhost:4321) en tu navegador.

---

## 📁 Estructura del Proyecto

```
mi-portal-de-empleo/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── OfertaCard.astro
│   │   ├── FiltrosBusqueda.astro
│   │   └── ui/
│   ├── layouts/             # Layouts de página
│   ├── pages/               # Páginas (file-based routing)
│   │   ├── index.astro      # Home
│   │   ├── oferta/[id].astro
│   │   ├── empleador/       # Dashboard empleadores
│   │   └── api/             # API routes serverless
│   ├── lib/                 # Lógica de negocio
│   │   ├── supabase.ts
│   │   ├── comunas.ts
│   │   ├── validations/
│   │   └── utils/
│   └── styles/              # Estilos globales
├── database/                # Schema SQL
├── .github/workflows/       # CI/CD
└── docs/                    # Documentación
```

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para más detalles.

---

## 🛠️ Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Construye para producción |
| `npm run preview` | Preview de la build |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Arregla errores de linting |
| `npm run format` | Formatea código con Prettier |
| `npm run type-check` | Verifica tipos de TypeScript |
| `npm test` | Ejecuta tests |
| `npm run test:coverage` | Genera reporte de cobertura |

---

## 🔒 Seguridad

Este proyecto implementa múltiples capas de seguridad:

- ✅ **IP Hashing**: Las IPs se hashean con SHA-256 (no se almacenan directamente)
- ✅ **Rate Limiting**: Multi-capa (IP, email, global)
- ✅ **Validación de Archivos**: Magic numbers + MIME types
- ✅ **Row Level Security**: RLS policies en PostgreSQL
- ✅ **Input Sanitization**: DOMPurify + Zod
- ✅ **Security Headers**: CSP, X-Frame-Options, etc.
- ✅ **Dependency Audits**: Automated con Dependabot

Ver [SECURITY.md](./SECURITY.md) para reportar vulnerabilidades.

---

## 📊 Performance

### Targets (Lighthouse)

- ⚡ Performance: **> 90**
- ♿ Accessibility: **> 95**
- 🏆 Best Practices: **> 90**
- 🔍 SEO: **> 95**

### Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee [CONTRIBUTING.md](./CONTRIBUTING.md) para conocer el proceso.

### Pasos rápidos:

1. Fork el proyecto
2. Crea una branch: `git checkout -b feature/mi-caracteristica`
3. Commit tus cambios: `git commit -m 'feat: agregar característica'`
4. Push: `git push origin feature/mi-caracteristica`
5. Abre un Pull Request

---

## 📝 Documentación

- [📐 ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del sistema
- [🤝 CONTRIBUTING.md](./CONTRIBUTING.md) - Guía de contribución
- [🔒 SECURITY.md](./SECURITY.md) - Política de seguridad
- [📋 SPECIFICATIONS.md](./SPECIFICATIONS.md) - Especificaciones completas

---

## 🗺️ Roadmap

### MVP (Fase 1) - ✅ En Progreso

- [x] Configuración del proyecto
- [x] Arquitectura y diseño
- [x] Schema de base de datos
- [x] API routes con seguridad
- [ ] Páginas frontend (home, detalle oferta)
- [ ] Dashboard de empleadores
- [ ] Deploy a producción

### Fase 2

- [ ] Geolocalización del usuario (GPS)
- [ ] Emails automáticos (confirmación, notificaciones)
- [ ] Dashboard con estadísticas
- [ ] Edición de ofertas
- [ ] PWA (Progressive Web App)

### Fase 3

- [ ] Sistema de notificaciones en tiempo real
- [ ] Búsqueda avanzada (Meilisearch/Algolia)
- [ ] Integración con LinkedIn
- [ ] Modo oscuro
- [ ] Internacionalización (i18n)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.

---

## 👥 Autores

- **DataAnalytics86** - *Trabajo Inicial* - [@datanalytics86](https://github.com/datanalytics86)

---

## 🙏 Agradecimientos

- [Astro](https://astro.build) por el increíble framework
- [Supabase](https://supabase.com) por el backend completo
- [Leaflet](https://leafletjs.com) por los mapas interactivos
- [OpenStreetMap](https://www.openstreetmap.org) por los datos geográficos
- [Vercel](https://vercel.com) por el hosting y deployment

---

## 📞 Contacto

¿Preguntas o sugerencias?

- 🐛 **Issues**: [GitHub Issues](https://github.com/datanalytics86/mi-portal-de-empleo/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/datanalytics86/mi-portal-de-empleo/discussions)
- 🔒 **Seguridad**: security@example.com

---

<div align="center">

**Hecho con ❤️ en Chile**

[⬆ Volver arriba](#-portal-de-empleo-chile)

</div>
