# Mi Portal de Empleo

Portal de empleos georreferenciado para Chile construido con **Astro 4**, **Tailwind CSS** y **Leaflet**. Permite postular sin registro, visualizar ofertas en un mapa interactivo y ofrece un modo empleador con dashboard y publicación guiada.

## Características clave
- Experiencia "cero fricción" para postulantes: subir CV sin crear cuenta.
- Georreferenciación con Leaflet + OpenStreetMap.
- UI responsiva, mobile-first y minimalista.
- Flujos de empleador: login, registro, dashboard y creación rápida de ofertas.
- Integración preparada para Supabase (DB + Storage + RLS) y validaciones con Zod.

## Requisitos
- Node.js 18+
- npm o pnpm

## Instalación
1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` con tus credenciales de Supabase:
   ```bash
   PUBLIC_SUPABASE_URL="https://<your-project>.supabase.co"
   PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
   ```

## Comandos
- Desarrollo: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Estructura
```
src/
├── components/
│   ├── FiltrosBusqueda.astro
│   ├── FormularioPostulacion.astro
│   ├── Hero.astro
│   ├── MapaOfertas.astro
│   ├── Navigation.astro
│   ├── OfertaCard.astro
│   └── ui/
│       ├── Badge.astro
│       ├── Button.astro
│       └── Input.astro
├── layouts/
│   └── Layout.astro
├── lib/
│   └── mockData.ts
├── pages/
│   ├── index.astro
│   ├── oferta/[id].astro
│   └── empleador/
│       ├── dashboard.astro
│       ├── login.astro
│       ├── registro.astro
│       └── oferta/nueva.astro
├── styles/
│   └── tailwind.css
└── utils/
    └── supabase.ts
```

## Testing rápido
Aún no hay pruebas automatizadas. Para validar la UI:
- `npm run dev` y abre `http://localhost:4321`.
- Navega por Home, detalle de oferta y flujos de empleador.

## Roadmap inmediato
- Conectar formularios a Supabase Storage y tablas con Zod para validación.
- Añadir filtrado real en el mapa y la lista.
- Implementar alertas y envío de emails transaccionales.
