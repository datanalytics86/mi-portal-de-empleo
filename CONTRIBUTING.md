# Guía de Contribución

¡Gracias por tu interés en contribuir al Portal de Empleo Chile! Este documento proporciona lineamientos para contribuir al proyecto.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Mejoras](#sugerir-mejoras)

## Código de Conducta

Este proyecto adhiere a un código de conducta. Al participar, se espera que mantengas un ambiente respetuoso y colaborativo.

### Comportamientos Esperados

- Usar lenguaje inclusivo y respetuoso
- Respetar diferentes puntos de vista y experiencias
- Aceptar críticas constructivas con gracia
- Enfocarse en lo que es mejor para la comunidad

### Comportamientos Inaceptables

- Uso de lenguaje o imágenes sexualizadas
- Comentarios insultantes o despectivos
- Acoso público o privado
- Publicar información privada de otros sin permiso

## ¿Cómo puedo contribuir?

### Reportar Bugs

Si encuentras un bug, por favor crea un issue con:

- **Título descriptivo**: Resume claramente el problema
- **Pasos para reproducir**: Lista los pasos exactos para reproducir el bug
- **Comportamiento esperado**: Describe qué esperabas que sucediera
- **Comportamiento actual**: Describe qué sucedió realmente
- **Capturas de pantalla**: Si es aplicable
- **Entorno**: Navegador, sistema operativo, versión de Node.js, etc.

### Sugerir Mejoras

Para sugerir una nueva característica:

1. Verifica que no exista ya un issue similar
2. Crea un nuevo issue con la etiqueta "enhancement"
3. Describe claramente la funcionalidad propuesta
4. Explica por qué sería útil
5. Proporciona ejemplos de uso si es posible

### Tu Primera Contribución de Código

¿Primera vez contribuyendo a open source? Puedes empezar con issues etiquetados como:

- `good first issue`: Problemas simples para principiantes
- `help wanted`: Issues donde necesitamos ayuda

## Configuración del Entorno de Desarrollo

### Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Cuenta en Supabase (para desarrollo local)
- Git

### Instalación

1. **Fork el repositorio** en GitHub

2. **Clona tu fork**:
   ```bash
   git clone https://github.com/TU-USUARIO/mi-portal-de-empleo.git
   cd mi-portal-de-empleo
   ```

3. **Agrega el repositorio original como remote**:
   ```bash
   git remote add upstream https://github.com/datanalytics86/mi-portal-de-empleo.git
   ```

4. **Instala dependencias**:
   ```bash
   npm install
   ```

5. **Configura variables de entorno**:
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales de Supabase
   ```

6. **Configura la base de datos**:
   - Ve a tu proyecto en Supabase
   - Ejecuta el script `database/schema.sql` en el SQL Editor

7. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

El proyecto estará disponible en `http://localhost:4321`

### Scripts Disponibles

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Preview de la build
npm run lint         # Ejecuta el linter
npm run lint:fix     # Arregla problemas de linting automáticamente
npm run format       # Formatea el código con Prettier
npm run type-check   # Verifica tipos de TypeScript
npm test             # Ejecuta tests
npm run test:ui      # Ejecuta tests con UI
npm run test:coverage # Genera reporte de cobertura
```

## Proceso de Desarrollo

### Flujo de Trabajo con Git

1. **Crea una branch desde `main`**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/nombre-descriptivo
   ```

2. **Realiza tus cambios**:
   - Escribe código limpio y bien documentado
   - Sigue los estándares de código del proyecto
   - Agrega tests si es aplicable

3. **Commit tus cambios**:
   ```bash
   git add .
   git commit -m "feat: descripción breve del cambio"
   ```

   Usa [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` Nueva característica
   - `fix:` Corrección de bug
   - `docs:` Cambios en documentación
   - `style:` Formateo, punto y coma faltantes, etc.
   - `refactor:` Refactorización de código
   - `test:` Agregar tests
   - `chore:` Mantenimiento general

4. **Push a tu fork**:
   ```bash
   git push origin feature/nombre-descriptivo
   ```

5. **Abre un Pull Request** en GitHub

### Testing

Antes de enviar un PR, asegúrate de que:

- [ ] Todos los tests existentes pasan
- [ ] Agregaste tests para nueva funcionalidad
- [ ] El código pasa el linter: `npm run lint`
- [ ] El código está formateado: `npm run format`
- [ ] No hay errores de TypeScript: `npm run type-check`
- [ ] La aplicación se construye sin errores: `npm run build`

## Estándares de Código

### TypeScript

- Usa tipos explícitos siempre que sea posible
- Evita usar `any`; usa `unknown` si es necesario
- Aprovecha la inferencia de tipos cuando sea claro

```typescript
// ✅ Bien
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Evitar
function calculateTotal(items: any): any {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Astro Components

- Mantén los componentes pequeños y enfocados
- Usa props tipadas con TypeScript
- Separa lógica compleja en utilidades

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<article>
  <h2>{title}</h2>
  {description && <p>{description}</p>}
</article>
```

### Estilo y Formateo

- Usamos Prettier para formateo automático
- 2 espacios de indentación
- Punto y coma al final de statements
- Comillas simples para strings
- Límite de 100 caracteres por línea

### Nombres

- **Variables y funciones**: camelCase (`getUserData`)
- **Componentes**: PascalCase (`UserProfile.astro`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Archivos**: kebab-case para utilidades (`format-date.ts`)

### Comentarios

- Usa JSDoc para funciones públicas
- Comenta el "por qué", no el "qué"
- Mantén los comentarios actualizados

```typescript
/**
 * Calcula la distancia entre dos puntos geográficos
 * Usa la fórmula de Haversine para mayor precisión
 *
 * @param lat1 - Latitud del primer punto
 * @param lng1 - Longitud del primer punto
 * @param lat2 - Latitud del segundo punto
 * @param lng2 - Longitud del segundo punto
 * @returns Distancia en kilómetros
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Implementación...
}
```

## Proceso de Pull Request

### Antes de Enviar

1. Actualiza tu branch con los últimos cambios de `main`
2. Asegúrate de que todos los tests pasen
3. Ejecuta `npm run build` para verificar que no hay errores
4. Revisa tus cambios cuidadosamente

### Descripción del PR

Tu PR debe incluir:

- **Título claro**: Resume el cambio en una línea
- **Descripción**: Explica qué hace el cambio y por qué
- **Issue relacionado**: Si aplica, referencia al issue (#123)
- **Screenshots**: Si hay cambios visuales
- **Checklist**: Marca todos los items completados

#### Template de PR

```markdown
## Descripción
Breve descripción del cambio y su motivación.

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva característica
- [ ] Cambio que rompe compatibilidad
- [ ] Documentación

## ¿Cómo se ha testeado?
Describe los tests que ejecutaste.

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He revisado mi propio código
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] No hay warnings nuevos
- [ ] He agregado tests
- [ ] Todos los tests pasan
```

### Proceso de Revisión

- Los maintainers revisarán tu PR dentro de 3-5 días
- Pueden solicitar cambios o mejoras
- Una vez aprobado, tu PR será merged
- Celebra tu contribución! 🎉

## Estructura del Proyecto

```
mi-portal-de-empleo/
├── src/
│   ├── components/      # Componentes de Astro
│   ├── layouts/         # Layouts de página
│   ├── pages/           # Páginas y rutas API
│   ├── lib/             # Utilidades y lógica de negocio
│   │   ├── validations/ # Schemas de validación (Zod)
│   │   ├── utils/       # Funciones auxiliares
│   │   └── types/       # Tipos de TypeScript
│   └── styles/          # Estilos globales
├── database/            # Scripts SQL
├── public/              # Assets estáticos
└── tests/               # Tests unitarios e integración
```

## Recursos Útiles

- [Documentación de Astro](https://docs.astro.build)
- [Documentación de Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Conventional Commits](https://www.conventionalcommits.org)

## Preguntas?

Si tienes preguntas, puedes:

- Abrir un issue con la etiqueta "question"
- Unirte a nuestras discusiones en GitHub Discussions
- Contactar a los maintainers

¡Gracias por contribuir! 🚀
