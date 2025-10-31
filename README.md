# Portal de Empleos Georeferenciado - Chile 🇨🇱

Plataforma web para conectar candidatos con ofertas laborales en Chile con georeferenciación mediante Leaflet y OpenStreetMap.

## 📦 Estructura del Repositorio

```
mi-portal-de-empleo/
├── src/              # Código fuente del proyecto Astro
├── public/           # Archivos estáticos
├── package.json      # Dependencias y scripts
├── astro.config.mjs  # Configuración de Astro
├── vercel.json       # Configuración de Vercel
└── README-PROJECT.md # Documentación completa del proyecto
```

## 🚀 Deployment en Vercel

### ⚠️ ERROR 404 EN VERCEL - SOLUCIÓN INMEDIATA

**🔴 Si ves `404: NOT_FOUND` en Vercel:**

**Lee este archivo AHORA:** [`SOLUCION-VERCEL-404.md`](./SOLUCION-VERCEL-404.md) ⭐

**Causa:** Vercel está deployando desde la rama `main` que NO tiene el código.
**Solución:** Cambiar Production Branch en Vercel (2 minutos).

---

### Si necesitas más troubleshooting:

- [`VERCEL-404-FIX.md`](./VERCEL-404-FIX.md) - Guía detallada de troubleshooting

### Deployment rápido:

1. **Configura variables de entorno en Vercel:**
   ```
   PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role
   PUBLIC_SITE_URL=https://tu-dominio.vercel.app
   ```

2. **Verifica configuración del proyecto:**
   - Framework: `Astro` (auto-detectado)
   - Root Directory: `.` (raíz, NO subcarpeta)
   - Build Command: `npm run build`
   - Output Directory: `.vercel/output`

3. **Deploy:**
   - Vercel detectará automáticamente los cambios en GitHub
   - O haz clic en "Redeploy" en Vercel Dashboard

## 📖 Documentación

- **[README-PROJECT.md](./README-PROJECT.md)** - Documentación completa del proyecto
- **[ARCHITECTURE-PROJECT.md](./ARCHITECTURE-PROJECT.md)** - Arquitectura técnica
- **[VERCEL-404-FIX.md](./VERCEL-404-FIX.md)** - Solución a errores 404 en Vercel ⭐
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Guía detallada de deployment
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Configuración de base de datos
- **[QA-QC-AUDIT-REPORT.md](./QA-QC-AUDIT-REPORT.md)** - Reporte de auditoría

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

## 📊 Stack Tecnológico

- **Framework:** Astro 5.x (SSR)
- **Styling:** Tailwind CSS 3.x
- **Backend:** Supabase (PostgreSQL + PostGIS + Storage + Auth)
- **Maps:** Leaflet 1.9.4
- **Deployment:** Vercel (serverless)
- **Validation:** Zod

## ✅ Estado del Proyecto

- ✅ Build local: **0 errores**
- ✅ Adapter: **@astrojs/vercel**
- ✅ Código en raíz: **Sí**
- ✅ Último commit: `20f5a51 - Move project to root for Vercel deployment`

## 🆘 Soporte

**Si Vercel muestra 404:**
1. Lee [`VERCEL-404-FIX.md`](./VERCEL-404-FIX.md)
2. Verifica variables de entorno en Vercel
3. Revisa Build Logs en Vercel Dashboard
4. Asegúrate de que Root Directory es `.` (raíz)

**Si tienes otros problemas:**
- Verifica que las dependencias están instaladas: `npm install`
- Verifica que el build local funciona: `npm run build`
- Lee la documentación completa en `README-PROJECT.md`

---

**Última actualización:** 31 de Octubre, 2025
