# 🚀 Instrucciones de Setup - Portal de Empleos Chile

**Guía paso a paso para configurar el backend con Supabase y Resend**

---

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta de GitHub (ya tienes)
- Cuenta de Vercel (ya conectada)

**Nuevos servicios necesarios:**
- Cuenta en Supabase (gratis)
- Cuenta en Resend (gratis hasta 3,000 emails/mes)

---

## ⚡ Quick Start (Desarrollo Local con Mock Data)

Si solo quieres probar la aplicación localmente SIN configurar backend:

```bash
npm install
npm run dev
```

La aplicación funcionará con datos mock. ¡Es así de simple!

---

## 🗄️ PASO 1: Configurar Supabase

### 1.1 Crear Proyecto

1. Ve a https://supabase.com
2. Click en "Start your project"
3. Crea una cuenta (usa GitHub OAuth para facilidad)
4. Click en "New Project"
5. Completa:
   - **Name:** portal-empleos-chile
   - **Database Password:** (genera una segura y guárdala)
   - **Region:** South America (sao1) - Más cercano a Chile
   - **Plan:** Free
6. Click "Create new project"
7. ⏳ Espera 2-3 minutos mientras se crea

### 1.2 Ejecutar el Schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor** (ícono </> en el menú lateral)
2. Click en "+ New Query"
3. Abre el archivo `supabase/schema.sql` de este proyecto
4. Copia TODO el contenido
5. Pégalo en el editor de Supabase
6. Click en "Run" (botón verde abajo)
7. ✅ Deberías ver "Success. No rows returned"

### 1.3 Configurar Storage para CVs

1. Ve a **Storage** en el menú lateral
2. Click "Create a new bucket"
3. Completa:
   - **Name:** archivos
   - **Public bucket:** ❌ NO (debe ser privado)
   - **Allowed MIME types:** application/pdf
   - **File size limit:** 5MB
4. Click "Create bucket"

#### Configurar Políticas de Storage:

1. Click en el bucket "archivos"
2. Ve a "Policies"
3. Click "New Policy"
4. Selecciona "Create a policy from scratch"
5. Agrega estas políticas:

**Política 1: Permitir subida de CVs**
```sql
-- INSERT policy
CREATE POLICY "Permitir subida de CVs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'archivos' AND (storage.foldername(name))[1] = 'cvs');
```

**Política 2: Permitir lectura solo al empleador dueño**
```sql
-- SELECT policy
CREATE POLICY "Empleadores leen CVs de sus ofertas"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'archivos' AND
  EXISTS (
    SELECT 1 FROM postulaciones p
    JOIN ofertas o ON o.id = p.oferta_id
    WHERE o.empleador_id = auth.uid()
    AND p.cv_url LIKE '%' || (storage.foldername(name))[2] || '%'
  )
);
```

### 1.4 Obtener Credenciales

1. Ve a **Settings** > **API** (ícono engranaje)
2. En "Project API keys" copia:
   - **Project URL** → Esta es tu `PUBLIC_SUPABASE_URL`
   - **anon public** → Esta es tu `PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → Esta es tu `SUPABASE_SERVICE_ROLE_KEY` (⚠️ SECRETA)

---

## 📧 PASO 2: Configurar Resend (Emails)

### 2.1 Crear Cuenta

1. Ve a https://resend.com
2. Click "Sign up"
3. Usa tu email de GitHub
4. Verifica tu email

### 2.2 Obtener API Key

1. En el dashboard, ve a **API Keys**
2. Click "Create API Key"
3. Nombre: "Portal Empleos - Producción"
4. Permission: "Full access" o "Sending access"
5. Click "Create"
6. ⚠️ **COPIA LA KEY AHORA** (no podrás verla después)
7. Guárdala como tu `RESEND_API_KEY`

### 2.3 Verificar Dominio (Opcional pero Recomendado)

Para producción, es mejor usar tu propio dominio:

1. Ve a **Domains**
2. Click "Add Domain"
3. Ingresa tu dominio (ej: tuportaldeem pleos.cl)
4. Sigue las instrucciones para agregar los registros DNS
5. Espera verificación (puede tomar 1-24 horas)

**Mientras tanto:** Puedes usar el dominio de Resend (onboarding@resend.dev) para pruebas.

---

## 🔧 PASO 3: Configurar Variables de Entorno

### 3.1 Desarrollo Local

1. En la raíz del proyecto, crea el archivo `.env`:
   ```bash
   cp .env.example .env
   ```

2. Abre `.env` y completa:
   ```env
   # SUPABASE
   PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # RESEND
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
   FROM_EMAIL=Portal Empleos Chile <noreply@tudominio.cl>

   # SITE
   PUBLIC_SITE_URL=http://localhost:4321
   ```

3. Guarda el archivo

4. ⚠️ **NUNCA** commitees el archivo `.env` al repositorio

### 3.2 Producción (Vercel)

1. Ve a tu proyecto en Vercel: https://vercel.com/[tu-usuario]/mi-portal-de-empleo
2. Ve a **Settings** > **Environment Variables**
3. Agrega TODAS estas variables:

| Variable | Valor | Environment |
|----------|-------|-------------|
| `PUBLIC_SUPABASE_URL` | (tu URL de Supabase) | Production, Preview, Development |
| `PUBLIC_SUPABASE_ANON_KEY` | (tu anon key) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | (tu service key) | Production, Preview, Development |
| `RESEND_API_KEY` | (tu API key) | Production, Preview, Development |
| `FROM_EMAIL` | Portal Empleos Chile <noreply@tudominio.cl> | Production, Preview, Development |
| `PUBLIC_SITE_URL` | https://tu-dominio.vercel.app | Production |

4. Click "Save" en cada una
5. Después de agregar todas, haz un nuevo deploy:
   ```bash
   git commit --allow-empty -m "Trigger deploy"
   git push
   ```

---

## ✅ PASO 4: Verificar que Todo Funciona

### 4.1 Verificar Localmente

```bash
# Instalar dependencias (si aún no lo hiciste)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre http://localhost:4321

**Pruebas a realizar:**

1. ✅ **Ver ofertas:** La home debe mostrar ofertas
2. ✅ **Registrar empleador:**
   - Ve a `/empleador/registro`
   - Crea una cuenta
   - Deberías recibir email de bienvenida
   - Deberías entrar al dashboard automáticamente
3. ✅ **Crear oferta:**
   - En el dashboard, click "Nueva Oferta"
   - Completa el formulario
   - La oferta debe aparecer en la home
4. ✅ **Postular a oferta:**
   - Abre una oferta
   - Completa el formulario y sube un PDF
   - Deberías recibir email de confirmación
   - El empleador debe recibir notificación
5. ✅ **Ver postulaciones:**
   - Como empleador, ve a "Ver Postulaciones"
   - Debes ver la postulación
   - Debes poder descargar el CV

### 4.2 Ver Datos en Supabase

1. Ve a Supabase Dashboard
2. Ve a **Table Editor**
3. Deberías ver datos en:
   - `empleadores` - Tu usuario registrado
   - `ofertas` - La oferta que creaste
   - `postulaciones` - La postulación de prueba
4. Ve a **Storage** > **archivos** > **cvs**
5. Deberías ver el PDF del CV

### 4.3 Verificar Emails en Resend

1. Ve a Resend Dashboard
2. Ve a **Emails**
3. Deberías ver los 2 emails enviados:
   - Confirmación al candidato
   - Notificación al empleador

---

## 🐛 Troubleshooting

### Error: "Supabase no configurado"

**Problema:** Las variables `PUBLIC_SUPABASE_URL` o `PUBLIC_SUPABASE_ANON_KEY` no están definidas

**Solución:**
1. Verifica que el archivo `.env` existe en la raíz
2. Verifica que las variables no tienen espacios extras
3. Reinicia el servidor dev (`npm run dev`)

### Error: "SUPABASE_SERVICE_ROLE_KEY is not set"

**Problema:** La variable de service role no está configurada

**Solución:**
1. Asegúrate de copiar el "service_role" key, NO el "anon" key
2. En Vercel, verifica que la variable está en todos los environments

### Error al subir CV: "new row violates row-level security policy"

**Problema:** Las políticas RLS están bloqueando la inserción

**Solución:**
1. Ve a Supabase > SQL Editor
2. Verifica que ejecutaste TODO el schema.sql
3. Verifica las políticas con:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

### No recibo emails

**Problema:** Resend no está configurado correctamente

**Solución:**
1. Verifica `RESEND_API_KEY` en `.env`
2. Verifica que la API key tiene permisos de "Sending"
3. Revisa la consola del servidor, debe decir "✅ Email enviado"
4. Revisa Resend Dashboard > Logs para ver errores

### Error 403 al acceder a Storage

**Problema:** Las políticas de Storage no están correctas

**Solución:**
1. Ve a Supabase > Storage > archivos > Policies
2. Asegúrate de haber creado ambas políticas (INSERT y SELECT)
3. Verifica que el bucket NO es público

---

## 📚 Próximos Pasos

Una vez que todo funciona:

1. ✅ **Conecta tu dominio personalizado en Vercel**
   - Settings > Domains > Add Domain

2. ✅ **Configura email personalizado en Resend**
   - Settings > Domains > Verify your domain

3. ✅ **Habilita Analytics (opcional)**
   - Vercel Analytics: Vercel Dashboard > Analytics
   - Supabase Analytics: Supabase Dashboard > Reports

4. ✅ **Configura Backups (recomendado)**
   - Supabase tiene backups automáticos en plan Pro
   - Free tier: Hacer backups manuales ocasionalmente

5. ✅ **Monitorea Errores**
   - Considera agregar Sentry para tracking de errores
   - Revisa logs en Vercel > Deployments > [deployment] > Functions

---

## 💰 Costos Estimados

**Desarrollo:** $0
- Supabase Free: 500MB database, 1GB storage, 50,000 monthly active users
- Resend Free: 3,000 emails/mes, 100 emails/día
- Vercel Hobby: Gratis

**Producción (escalado):**
- Supabase Pro: $25/mes (8GB database, 100GB storage)
- Resend Pro: $20/mes (50,000 emails/mes)
- Vercel Pro: $20/mes
- **Total: ~$65/mes**

---

## 📞 Soporte

Si tienes problemas:

1. Revisa esta guía completamente
2. Revisa la sección Troubleshooting
3. Revisa los logs en:
   - Terminal local
   - Vercel > Functions
   - Supabase > Logs
   - Resend > Logs

---

**¡Felicitaciones! 🎉 Tu portal de empleos está listo para producción.**
