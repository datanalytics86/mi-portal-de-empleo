# 🔧 TROUBLESHOOTING: Vercel 404 Error

**Error ID:** `gru1::dfbq8-1761938767537-87ad42c1feb7`
**Error:** `404: NOT_FOUND`
**Fecha:** 31 de Octubre, 2025

---

## 🎯 DIAGNÓSTICO

El proyecto está **100% funcional localmente** pero Vercel muestra 404. Esto indica un problema de configuración en Vercel, **NO en el código**.

### ✅ Verificado - Todo funciona localmente:
- ✅ Build exitoso (0 errores)
- ✅ Todos los archivos en la raíz del repositorio
- ✅ `package.json`, `astro.config.mjs`, `src/`, `public/` presentes
- ✅ Adapter @astrojs/vercel configurado
- ✅ Ruta `/` configurada en `.vercel/output/config.json`
- ✅ Último commit pusheado: `20f5a51 - Move project to root for Vercel deployment`

---

## 🔍 CAUSAS POSIBLES Y SOLUCIONES

### **SOLUCIÓN 1: Variables de Entorno Faltantes** ⭐ MÁS PROBABLE

Vercel **requiere** las variables de entorno de Supabase para hacer el build. Sin ellas, el build falla silenciosamente y muestra 404.

#### Verificar en Vercel:
1. Ve a tu proyecto en **Vercel Dashboard**
2. Click en **Settings** → **Environment Variables**
3. Verifica que existan estas 4 variables para **Production**:

```
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PUBLIC_SITE_URL
```

#### Si NO existen, agrégalas:

**PUBLIC_SUPABASE_URL**
```
https://tu-proyecto.supabase.co
```

**PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (tu clave anon de Supabase)
```

**SUPABASE_SERVICE_ROLE_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (tu clave service_role de Supabase)
```

**PUBLIC_SITE_URL**
```
https://tu-dominio.vercel.app
```

**¿Dónde obtener las claves de Supabase?**
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en **Settings** → **API**
3. Copia:
   - `URL` → PUBLIC_SUPABASE_URL
   - `anon public` → PUBLIC_SUPABASE_ANON_KEY
   - `service_role` (⚠️ secret) → SUPABASE_SERVICE_ROLE_KEY

**Después de agregar las variables:**
1. Ve a **Deployments**
2. Click en el deployment más reciente
3. Click en **⋯ (tres puntos)** → **Redeploy**
4. **Desmarca** "Use existing Build Cache"
5. Click **Redeploy**

---

### **SOLUCIÓN 2: Vercel está usando una rama incorrecta**

#### Verificar:
1. Ve a **Vercel Dashboard** → **Settings** → **Git**
2. Busca **Production Branch**
3. Verifica qué rama está configurada

#### Si dice `main` o `master`:
Tu código está en la rama `claude/create-markdown-file-011CUdTw65DVXTiGXtxbnE39`, pero Vercel está deployando desde `main`/`master` que no tiene el código actualizado.

#### Solución A - Cambiar la rama de producción:
1. En **Settings** → **Git** → **Production Branch**
2. Cambia a: `claude/create-markdown-file-011CUdTw65DVXTiGXtxbnE39`
3. Guarda y redeploy

#### Solución B - Mergear a main (RECOMENDADO):
```bash
# Mergear la rama de trabajo a main
git checkout main
git merge claude/create-markdown-file-011CUdTw65DVXTiGXtxbnE39
git push origin main
```

---

### **SOLUCIÓN 3: Root Directory configurado incorrectamente**

#### Verificar:
1. Ve a **Settings** → **General**
2. Busca **Root Directory**
3. Debe estar **vacío** o configurado como `.` (punto)

#### Si dice `portal-empleos-chile`:
Eso está mal, el proyecto ya NO está en esa subcarpeta.

#### Solución:
1. Cambia **Root Directory** a `.` (punto) o déjalo vacío
2. Guarda
3. Ve a **Deployments** → **Redeploy** (sin caché)

---

### **SOLUCIÓN 4: Build Command incorrecto**

#### Verificar:
1. Ve a **Settings** → **General** → **Build & Development Settings**
2. **Framework Preset** debe ser: `Astro`
3. **Build Command** debe ser: `npm run build`
4. **Output Directory** debe estar vacío o ser `.vercel/output`
5. **Install Command** debe ser: `npm install`

#### Si algo está mal:
1. Corrige los valores
2. Guarda
3. Redeploy sin caché

---

### **SOLUCIÓN 5: Deployment antiguo cacheado**

#### Forzar nuevo deployment limpio:
1. Ve a **Deployments**
2. Encuentra el deployment más reciente
3. Click en **⋯** → **Redeploy**
4. **IMPORTANTE:** Desmarca "Use existing Build Cache"
5. Click **Redeploy**

---

## 📋 CHECKLIST COMPLETO

Marca cada item a medida que lo verificas:

### Variables de Entorno:
- [ ] `PUBLIC_SUPABASE_URL` configurada en Vercel
- [ ] `PUBLIC_SUPABASE_ANON_KEY` configurada en Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada en Vercel
- [ ] `PUBLIC_SITE_URL` configurada en Vercel
- [ ] Variables configuradas para **Production** (no solo Preview)

### Configuración Git:
- [ ] Production Branch es correcta (`main` o tu rama de trabajo)
- [ ] Código está pusheado a esa rama
- [ ] Vercel tiene acceso al repositorio

### Configuración del Proyecto:
- [ ] Root Directory es `.` o está vacío (NO `portal-empleos-chile`)
- [ ] Framework Preset: `Astro`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: vacío o `.vercel/output`

### Deployment:
- [ ] Hiciste un redeploy SIN caché
- [ ] Revisaste los Build Logs (sin errores)
- [ ] Esperaste a que el deployment termine (status: Ready)

---

## 🔎 CÓMO VER LOS BUILD LOGS EN VERCEL

**Esto es CRÍTICO para diagnosticar el problema:**

1. Ve a **Vercel Dashboard**
2. Click en tu proyecto
3. Click en la pestaña **Deployments**
4. Click en el deployment más reciente (el de arriba)
5. Verás pestañas: **Building**, **Checks**, **Functions**, **Domains**
6. Click en **Building**
7. Busca errores en rojo o warnings en amarillo

**Si ves errores relacionados con Supabase:**
- ❌ `Missing Supabase environment variables`
- ❌ `PUBLIC_SUPABASE_URL is not defined`
- ❌ `Cannot read property of undefined`

→ **SOLUCIÓN:** Agrega las variables de entorno (Solución 1)

**Si el build dice "Success" pero aún da 404:**
- Verifica que el deployment esté en status "Ready"
- Verifica que la URL que accedes coincide con el deployment
- Verifica Root Directory (Solución 3)

---

## 🆘 SI NADA FUNCIONA

### Opción 1: Crear nuevo proyecto en Vercel

1. **Elimina el proyecto actual** en Vercel Dashboard
2. **Crea un nuevo proyecto** en Vercel
3. **Importa** el repositorio de GitHub: `datanalytics86/mi-portal-de-empleo`
4. **Configura:**
   - Framework: Astro (auto-detectado)
   - Root Directory: `.` (vacío)
   - Build Command: `npm run build`
5. **Agrega variables de entorno** ANTES de deployar
6. Click **Deploy**

### Opción 2: Verificar que el commit está en GitHub

```bash
# En tu terminal local, verifica que el commit se pusheó
git log -1 --oneline
# Debería mostrar: 20f5a51 Move project to root for Vercel deployment

# Verifica en GitHub que el commit existe:
# https://github.com/datanalytics86/mi-portal-de-empleo/commits/tu-rama
```

---

## 📊 INFORMACIÓN DEL BUILD LOCAL (Para Comparar)

**Tu build local funciona perfectamente:**

```
✅ Result: 0 errors, 0 warnings, 5 hints
✅ Build directory: /home/user/mi-portal-de-empleo/dist/
✅ Adapter: @astrojs/vercel
✅ Output: .vercel/output/ generado correctamente
✅ Routes: ^/$ → _render (configurado)
```

**Vercel debería replicar exactamente este resultado.**

---

## 🎯 PRÓXIMO PASO RECOMENDADO

**Revisa los Build Logs en Vercel PRIMERO.** Eso te dirá exactamente qué está fallando.

**Si ves errores de variables de entorno → Solución 1**
**Si el build es exitoso pero da 404 → Solución 2 o 3**

---

## 📞 INFORMACIÓN DE CONTACTO

**Último commit:**
```
20f5a51 - Move project to root for Vercel deployment
Fecha: 2025-10-31 19:12:28 UTC
```

**Branch:** `claude/create-markdown-file-011CUdTw65DVXTiGXtxbnE39`

**Repositorio:** `datanalytics86/mi-portal-de-empleo`

---

**Actualizado:** 31 de Octubre, 2025
**Estado del código:** ✅ Funcional y listo para deployment
