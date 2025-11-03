# Testing Mobile y Safari - Checklist

## 📋 Descripción

Guía completa para testing manual en dispositivos móviles y navegadores Safari antes del lanzamiento a producción.

## 🎯 Objetivos

- ✅ Verificar responsive design en dispositivos reales
- ✅ Validar funcionalidad en Safari (desktop y mobile)
- ✅ Asegurar que todas las características funcionen correctamente
- ✅ Detectar issues de rendimiento en dispositivos móviles

## 📱 Dispositivos a Testear

### Prioridad Alta
- [ ] **iPhone (Safari iOS)**
  - iPhone 14/15 (o similar)
  - iOS 16 o superior

- [ ] **Android (Chrome)**
  - Samsung Galaxy / Pixel
  - Android 12 o superior

### Prioridad Media
- [ ] **iPad (Safari iPadOS)**
  - iPad Air / Pro
  - iPadOS 16 o superior

- [ ] **Safari Desktop (macOS)**
  - macOS Ventura o superior
  - Safari 16+

## 🧪 Checklist de Testing

### 1. HOME PAGE (/)

#### Desktop Safari
- [ ] Página carga correctamente
- [ ] Dark mode toggle funciona
- [ ] Mapa interactivo (Leaflet) se muestra y es funcional
- [ ] Zoom del mapa funciona con trackpad
- [ ] Marcadores en el mapa aparecen correctamente
- [ ] Click en marcador muestra popup con información
- [ ] Lista de ofertas se muestra correctamente
- [ ] Búsqueda en tiempo real funciona
- [ ] Filtros (tipo de jornada, categoría) funcionan
- [ ] Links a ofertas individuales funcionan

#### Mobile (iOS Safari)
- [ ] Página responsive se ve bien
- [ ] Mapa se ajusta al ancho de pantalla
- [ ] Pinch to zoom funciona en el mapa
- [ ] Tap en marcador muestra popup
- [ ] Lista de ofertas es scrollable
- [ ] Búsqueda funciona (keyboard aparece correctamente)
- [ ] Filtros son accesibles y funcionan
- [ ] No hay elementos cortados o fuera de pantalla
- [ ] Scroll suave y sin lag
- [ ] Botones táctiles tienen buen tamaño (min 44x44px)

#### Mobile (Android Chrome)
- [ ] Mismas validaciones que iOS
- [ ] Back button del navegador funciona
- [ ] Share button funciona (si está implementado)

### 2. DETALLE DE OFERTA (/oferta/[id])

#### Desktop Safari
- [ ] Página de detalle carga correctamente
- [ ] Breadcrumb funciona (link a home)
- [ ] Descripción de oferta se muestra completa
- [ ] Mapa de ubicación individual funciona
- [ ] Formulario de postulación visible en sidebar
- [ ] Sticky sidebar funciona al hacer scroll

#### Mobile (iOS Safari)
- [ ] Layout responsive funciona (formulario debajo de descripción)
- [ ] Mapa de ubicación funciona en mobile
- [ ] Scroll entre descripción y formulario es fluido
- [ ] Botón "Volver" funciona

### 3. FORMULARIO DE POSTULACIÓN

#### Desktop Safari
- [ ] Formulario se muestra correctamente
- [ ] Todos los campos son accesibles
- [ ] Validación de email funciona
- [ ] Validación de teléfono funciona
- [ ] Validación de RUT funciona (formato chileno)
- [ ] Formateo automático funciona (RUT, teléfono)
- [ ] **Drag & drop de CV funciona**
- [ ] Click para seleccionar CV funciona
- [ ] Preview de archivo seleccionado aparece
- [ ] Botón "Eliminar archivo" funciona
- [ ] Campos opcionales expandibles funcionan
- [ ] Indicador de completitud se actualiza
- [ ] Checkbox de privacidad es obligatorio
- [ ] Submit button se deshabilita durante envío
- [ ] Loading spinner aparece

#### Mobile (iOS Safari)
- [ ] Todos los campos son accesibles
- [ ] Keyboard apropiado aparece (email, tel, number)
- [ ] **Drag & drop NO funciona pero click SÍ**
- [ ] Camera/Photo library picker aparece al seleccionar CV
- [ ] Puede seleccionar PDF desde Files app
- [ ] Validaciones en tiempo real funcionan
- [ ] Mensajes de error son legibles
- [ ] Formulario es scrollable si es largo
- [ ] Submit funciona sin recargar página
- [ ] Mensaje de éxito/error aparece correctamente

#### Mobile (Android Chrome)
- [ ] File picker funciona para seleccionar PDF
- [ ] Puede seleccionar desde Google Drive / Downloads
- [ ] Resto de validaciones iguales a iOS

### 4. SUBIDA DE CV (CRÍTICO)

#### Formatos a Testear
- [ ] PDF pequeño (< 1MB) se sube correctamente
- [ ] PDF grande (3-5MB) se sube correctamente
- [ ] PDF muy grande (> 5MB) es rechazado con error
- [ ] Archivo no-PDF (JPG, DOC) es rechazado con error

#### Desktop Safari
- [ ] Drag & drop funciona
- [ ] Click en zona funciona
- [ ] Progress bar aparece (si está implementado)
- [ ] Subida exitosa muestra confirmación
- [ ] Error muestra mensaje apropiado

#### Mobile
- [ ] Selección desde galería funciona
- [ ] Selección desde Files/Drive funciona
- [ ] Subida en conexión 4G/5G funciona
- [ ] Subida en WiFi funciona
- [ ] Timeout no ocurre (o es manejado)
- [ ] Mensaje de éxito/error es visible

### 5. ÁREA EMPLEADOR

#### Desktop Safari
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Dashboard carga correctamente
- [ ] Tabla de ofertas es responsive
- [ ] Crear oferta funciona
- [ ] Selector de región/comuna funciona
- [ ] Ver postulaciones funciona
- [ ] Descargar CVs funciona
- [ ] Activar/desactivar ofertas funciona
- [ ] Logout funciona

#### Mobile
- [ ] Login/Registro funcionan en mobile
- [ ] Dashboard es usable en mobile
- [ ] Tabla de ofertas es scrollable horizontalmente (si es necesario)
- [ ] Crear oferta funciona (formulario responsive)
- [ ] Ver postulaciones funciona
- [ ] Descargar CVs funciona (abre en nueva pestaña o descarga)

### 6. DARK MODE

#### Todos los Dispositivos
- [ ] Toggle de dark mode funciona
- [ ] Preferencia se guarda (localStorage)
- [ ] Preferencia persiste al recargar
- [ ] Todos los textos son legibles en dark mode
- [ ] Todos los iconos son visibles en dark mode
- [ ] Mapa se adapta a dark mode (si está implementado)
- [ ] Contraste es adecuado (WCAG AA mínimo)

### 7. RENDIMIENTO

#### Métricas a Medir

**Desktop Safari:**
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.8s
- [ ] Cumulative Layout Shift < 0.1

**Mobile (3G/4G):**
- [ ] First Contentful Paint < 3s
- [ ] Largest Contentful Paint < 4s
- [ ] Time to Interactive < 6s
- [ ] Página usable en 3G slow

#### Herramientas
- [ ] Lighthouse (Chrome DevTools)
- [ ] WebPageTest.org
- [ ] Safari Developer Tools (Network)

### 8. NAVEGACIÓN

#### Todos los Dispositivos
- [ ] Links internos funcionan
- [ ] Botón "Atrás" del navegador funciona
- [ ] URLs son correctas (no hay broken links)
- [ ] 404 page se muestra para rutas inválidas
- [ ] Redirecciones funcionan correctamente

### 9. ACCESIBILIDAD

#### Keyboard Navigation (Desktop)
- [ ] Tab navega por todos los campos
- [ ] Enter submite formularios
- [ ] Escape cierra modales (si hay)
- [ ] Focus visible en todos los elementos

#### Screen Reader (Opcional)
- [ ] VoiceOver (iOS/macOS) lee correctamente
- [ ] TalkBack (Android) lee correctamente
- [ ] Etiquetas ARIA están presentes

### 10. EDGE CASES

#### Todos los Dispositivos
- [ ] Conexión lenta (3G) funciona sin crashes
- [ ] Pérdida de conexión muestra error apropiado
- [ ] Reconexión recupera estado
- [ ] Formulario no se pierde al recargar (localStorage)
- [ ] Rate limiting muestra mensaje correcto
- [ ] Múltiples postulaciones a misma oferta es bloqueado

## 🛠️ Herramientas de Testing

### Emuladores y Simuladores

**iOS Simulator (macOS):**
```bash
# Abrir Xcode → Open Developer Tool → Simulator
# Seleccionar iPhone 14 / iPad Air
# Abrir Safari y navegar a localhost:4321
```

**Android Emulator:**
```bash
# Android Studio → Virtual Device Manager
# Crear Pixel 6 con Android 13
# Abrir Chrome y navegar a la IP de tu computadora
```

### Testing Remoto

**BrowserStack (Recomendado):**
- Acceso a dispositivos reales
- iOS, Android, Safari real
- Free tier disponible

**LambdaTest:**
- Similar a BrowserStack
- Precio competitivo

### Testing Local en Dispositivos Reales

**Método 1: Misma Red WiFi**
1. Computadora y móvil en misma red
2. Encontrar IP de computadora: `ifconfig` (macOS/Linux) o `ipconfig` (Windows)
3. En móvil: abrir Safari y navegar a `http://192.168.X.X:4321`

**Método 2: ngrok (Testing desde Internet)**
```bash
# Instalar ngrok
npm install -g ngrok

# En una terminal, iniciar dev server
npm run dev

# En otra terminal, exponer puerto
ngrok http 4321

# Usar URL pública de ngrok en móvil
https://abc123.ngrok.io
```

## 📊 Reportar Bugs

Cuando encuentres un bug, reporta con:

```markdown
## Bug: [Título descriptivo]

**Dispositivo:** iPhone 14 Pro, iOS 17.1
**Navegador:** Safari 17
**URL:** /oferta/123
**Prioridad:** Alta / Media / Baja

**Pasos para reproducir:**
1. Ir a oferta
2. Hacer click en formulario
3. Intentar subir CV
4. Error aparece

**Comportamiento esperado:**
CV debería subirse correctamente

**Comportamiento actual:**
Error: "Failed to upload file"

**Screenshot:**
[Adjuntar captura de pantalla]

**Logs de consola:**
```
Error: Network request failed
at fetch.js:123
```
```

## ✅ Criterios de Aprobación

El proyecto está listo para producción cuando:

- [ ] **Todos** los items críticos (marcados ⚠️) pasan
- [ ] 90%+ de items de prioridad alta pasan
- [ ] 70%+ de items de prioridad media pasan
- [ ] No hay bugs bloqueantes
- [ ] Rendimiento es aceptable en 4G
- [ ] Formulario de postulación funciona en iOS Safari
- [ ] Subida de CVs funciona en todos los dispositivos

## 🔴 Bugs Críticos (Blockers)

Estos bugs **deben** ser resueltos antes de producción:

- [ ] Formulario no funciona en Safari
- [ ] Subida de CV falla en mobile
- [ ] Página crashea en dispositivos específicos
- [ ] Datos sensibles expuestos
- [ ] Rate limiting no funciona
- [ ] Autenticación bypasseable

## 🟡 Bugs Importantes (Fix Soon)

Resolver en la primera semana post-lanzamiento:

- [ ] Dark mode tiene bugs visuales menores
- [ ] Mapa tiene lag en zoom
- [ ] Algunas validaciones son lentas

## 🟢 Mejoras Futuras (Nice to Have)

- [ ] Optimizar carga de imágenes
- [ ] Agregar PWA capabilities
- [ ] Mejorar animaciones
- [ ] Agregar más filtros

## 📝 Notas

- **Testing real > Emuladores:** Siempre priorizar testing en dispositivos reales
- **Safari es especial:** Safari tiene comportamientos únicos que Chrome no tiene
- **Touch targets:** Mínimo 44x44px para elementos táctiles (guía iOS)
- **Viewport:** Usar `<meta name="viewport" content="width=device-width, initial-scale=1">`
- **File input en iOS:** Drag & drop no funciona, solo click para abrir picker

## 🔗 Referencias

- [Safari Web Inspector](https://developer.apple.com/safari/tools/)
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)
- [iOS Safari Quirks](https://www.quirksmode.org/webkit.html)
- [Can I Use](https://caniuse.com/) - Compatibilidad de features
- [WebPageTest](https://www.webpagetest.org/) - Testing de rendimiento

---

**Última actualización:** Noviembre 2024
**Mantenedor:** Equipo de Desarrollo
