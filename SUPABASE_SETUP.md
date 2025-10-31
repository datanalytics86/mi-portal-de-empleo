# Guía de Configuración de Supabase

Esta guía te ayudará a configurar Supabase para el Portal de Empleos Chile paso a paso.

## 📋 Pre-requisitos

- Cuenta en [supabase.com](https://supabase.com)
- Node.js instalado localmente
- Proyecto Astro configurado (Paso 1 completado)

---

## 🚀 Paso 1: Crear Proyecto en Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Click en "New Project"
3. Completa los datos:
   - **Name**: `portal-empleos-chile`
   - **Database Password**: (genera una segura y guárdala)
   - **Region**: `South America (São Paulo)` (más cercana a Chile)
   - **Pricing Plan**: Free (suficiente para MVP)
4. Click "Create new project"
5. Espera 2-3 minutos mientras se aprovisiona

---

## 🗄️ Paso 2: Ejecutar el Schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor** (icono en sidebar)
2. Click en **New Query**
3. Copia TODO el contenido del archivo `supabase-schema.sql`
4. Pégalo en el editor
5. Click en **Run** (o presiona Ctrl+Enter)
6. Verifica que aparezca: ✅ "Schema creado exitosamente!"

**Verificación:**
- Ve a **Table Editor** en el sidebar
- Deberías ver 3 tablas: `empleadores`, `ofertas`, `postulaciones`

---

## 📦 Paso 3: Crear Storage Bucket para CVs

1. En el dashboard, ve a **Storage** en el sidebar
2. Click en **Create a new bucket**
3. Configura el bucket:

```
Name: cvs
Public: OFF (desactivado)
File size limit: 5 MB
Allowed MIME types:
  - application/pdf
  - application/msword
  - application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

4. Click **Create bucket**

**Verificación:**
- Deberías ver el bucket "cvs" en la lista

---

## 🔐 Paso 4: Configurar Authentication

1. Ve a **Authentication** → **Providers** en el sidebar
2. Asegúrate de que **Email** esté habilitado (viene activado por defecto)
3. Configuración recomendada:

```
Enable Email provider: YES
Enable Email confirmations: NO (para desarrollo)
Enable Secure password change: YES
Minimum password length: 8
```

4. **Opcional**: Configura Email Templates personalizados
   - Ve a Authentication → Email Templates
   - Personaliza los emails de confirmación y recuperación

---

## 🔑 Paso 5: Obtener las Credenciales

1. Ve a **Project Settings** (⚙️ icono en sidebar inferior)
2. Click en **API** en el menú lateral
3. Copia las siguientes credenciales:

### URL del Proyecto
```
URL: https://xxxxx.supabase.co
```

### Claves de API
```
anon (public) key: eyJhbGc...
service_role key: eyJhbGc... (MANTÉN SECRETA)
```

---

## 🔧 Paso 6: Configurar Variables de Entorno

1. En la raíz del proyecto, crea el archivo `.env`:

```bash
cp .env.example .env
```

2. Edita `.env` y agrega tus credenciales:

```env
# Supabase
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Configuración
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_MAX_CV_SIZE=5242880
```

**⚠️ IMPORTANTE:**
- NUNCA commitees el archivo `.env` al repositorio
- La `SERVICE_ROLE_KEY` solo debe usarse en el servidor (API routes)
- La `ANON_KEY` es segura para exponerse en el cliente

---

## ✅ Paso 7: Verificar la Conexión

1. Crea un archivo de prueba `test-supabase.ts`:

```typescript
import { supabase } from './src/lib/supabase';

async function testConnection() {
  const { data, error } = await supabase
    .from('ofertas')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Error conectando a Supabase:', error);
  } else {
    console.log('✅ Conexión exitosa a Supabase!');
  }
}

testConnection();
```

2. Ejecuta:
```bash
npx tsx test-supabase.ts
```

3. Deberías ver: ✅ "Conexión exitosa a Supabase!"

---

## 📊 Paso 8: Verificar RLS Policies

1. Ve a **Authentication** → **Policies** en el dashboard
2. Verifica que veas las policies creadas:

### Tabla `ofertas`:
- ✅ "Ofertas activas son públicas" (SELECT)
- ✅ "Empleadores pueden crear ofertas" (INSERT)
- ✅ "Empleadores pueden actualizar sus ofertas" (UPDATE)
- ✅ "Empleadores pueden eliminar sus ofertas" (DELETE)

### Tabla `postulaciones`:
- ✅ "Cualquiera puede postular" (INSERT)
- ✅ "Empleadores ven postulaciones de sus ofertas" (SELECT)

### Tabla `empleadores`:
- ✅ "Empleadores pueden ver su propio perfil" (SELECT)
- ✅ "Empleadores pueden actualizar su propio perfil" (UPDATE)

---

## 🧪 Paso 9: Insertar Datos de Prueba (Opcional)

Para desarrollo, puedes insertar datos de ejemplo:

1. Ve a **SQL Editor**
2. Ejecuta este SQL:

```sql
-- Crear un empleador de prueba
INSERT INTO empleadores (id, email, nombre_empresa) VALUES
('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Empresa Demo');

-- Crear ofertas de prueba
INSERT INTO ofertas (empleador_id, titulo, descripcion, empresa, tipo_jornada, categoria, comuna, ubicacion) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Desarrollador Full Stack',
  'Buscamos desarrollador con experiencia en React y Node.js',
  'Empresa Demo',
  'Full-time',
  'Tecnología',
  'Santiago',
  ST_SetSRID(ST_MakePoint(-70.6693, -33.4489), 4326)::GEOGRAPHY
),
(
  '00000000-0000-0000-0000-000000000001',
  'Diseñador UX/UI',
  'Diseñador creativo para productos digitales',
  'Empresa Demo',
  'Part-time',
  'Diseño',
  'Providencia',
  ST_SetSRID(ST_MakePoint(-70.6167, -33.4333), 4326)::GEOGRAPHY
);
```

---

## 🔍 Troubleshooting

### Error: "Database error saving new user"
- **Causa**: La tabla `empleadores` no existe o tiene error de schema
- **Solución**: Re-ejecuta `supabase-schema.sql`

### Error: "Invalid API key"
- **Causa**: Variables de entorno mal configuradas
- **Solución**: Verifica que las keys en `.env` sean correctas

### Error: "Row Level Security"
- **Causa**: Intentas acceder a datos sin autenticación
- **Solución**: Verifica las RLS policies en el dashboard

### Storage: "Access denied"
- **Causa**: Policies de Storage no aplicadas correctamente
- **Solución**: Ve a Storage → Policies y verifica que existan las 3 policies

---

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [PostGIS Guide](https://postgis.net/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage#policy-examples)

---

## ✅ Checklist Final

Antes de continuar con el Paso 3, verifica:

- [ ] Proyecto Supabase creado
- [ ] Schema SQL ejecutado exitosamente
- [ ] 3 tablas visibles en Table Editor
- [ ] Bucket "cvs" creado en Storage
- [ ] Storage policies aplicadas
- [ ] Email provider habilitado en Authentication
- [ ] Variables de entorno configuradas en `.env`
- [ ] Conexión verificada con script de prueba
- [ ] RLS policies visibles en dashboard

**Todo listo? Continúa con el Paso 3: Implementar página home con mapa** 🎉
