# Portal Empleo Chile

Experiencia de empleo georreferenciada y sin fricción construida con [Astro](https://astro.build/) y [Tailwind CSS](https://tailwindcss.com/).

## Características

- Diseño premium con enfoque mobile-first y glassmorphism.
- Integración con Leaflet para visualizar ofertas en un mapa interactivo.
- Componentes reutilizables para filtros, tarjetas de ofertas y estadísticas.
- Tipografía moderna (Plus Jakarta Sans + Bricolage Grotesque) y paleta personalizada.

## Requisitos

- Node.js 18+
- npm

## Scripts

```bash
npm install
npm run dev     # Inicia el servidor en modo desarrollo
npm run build   # Genera la versión de producción
npm run preview # Previsualiza la compilación
```

## Estructura

```
src/
├── components/       # UI modular (mapa, tarjetas, filtros)
├── layouts/          # Layout base con navegación y footer
├── lib/              # Datos mock y tipos compartidos
├── pages/            # Rutas de la aplicación
└── styles/           # Estilos globales con Tailwind
```
