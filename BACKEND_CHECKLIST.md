# Checklist - Backend Funcional y Profesional
## Portal de Empleos Chile - Roadmap de Implementación

---

## 🗄️ **FASE 1: BASE DE DATOS Y MODELOS**

### 1.1 Configuración de Base de Datos
- [ ] Elegir sistema de BD (PostgreSQL recomendado para geo-queries)
- [ ] Configurar Supabase o servicio de BD en producción
- [ ] Crear migraciones para todas las tablas
- [ ] Configurar connection pooling
- [ ] Implementar índices para búsquedas optimizadas
- [ ] Configurar réplicas para lectura (opcional, escalabilidad)

### 1.2 Esquema de Tablas Requeridas
```sql
-- Tabla: ofertas
- [ ] id (UUID, PK)
- [ ] titulo (VARCHAR)
- [ ] descripcion (TEXT)
- [ ] empresa (VARCHAR)
- [ ] empleador_id (UUID, FK)
- [ ] comuna (VARCHAR)
- [ ] region (VARCHAR)
- [ ] lat/lng (NUMERIC para georeferenciación)
- [ ] tipo_jornada (ENUM)
- [ ] categoria (VARCHAR)
- [ ] salario_min/max (NUMERIC, opcional)
- [ ] created_at, updated_at, expires_at (TIMESTAMP)
- [ ] activa (BOOLEAN)
- [ ] postulaciones_count (INTEGER)

-- Tabla: empleadores
- [ ] id (UUID, PK)
- [ ] email (VARCHAR, UNIQUE)
- [ ] password_hash (VARCHAR)
- [ ] nombre_empresa (VARCHAR)
- [ ] rut_empresa (VARCHAR, opcional)
- [ ] telefono (VARCHAR, opcional)
- [ ] verificado (BOOLEAN)
- [ ] created_at, updated_at (TIMESTAMP)

-- Tabla: postulaciones
- [ ] id (UUID, PK)
- [ ] oferta_id (UUID, FK)
- [ ] nombre_candidato (VARCHAR, nullable)
- [ ] email_candidato (VARCHAR, nullable)
- [ ] cv_url (VARCHAR)
- [ ] ip_address (INET para anti-spam)
- [ ] created_at (TIMESTAMP)
- [ ] estado (ENUM: nueva, revisada, rechazada, etc)

-- Tabla: sessions (para empleadores)
- [ ] id (UUID, PK)
- [ ] empleador_id (UUID, FK)
- [ ] token (VARCHAR)
- [ ] expires_at (TIMESTAMP)
- [ ] ip_address (INET)
- [ ] user_agent (TEXT)

-- Tabla: rate_limits (anti-abuse)
- [ ] id (UUID, PK)
- [ ] ip_address (INET)
- [ ] endpoint (VARCHAR)
- [ ] count (INTEGER)
- [ ] window_start (TIMESTAMP)
```

### 1.3 Relaciones y Constraints
- [ ] FK: ofertas.empleador_id → empleadores.id (CASCADE on delete)
- [ ] FK: postulaciones.oferta_id → ofertas.id (CASCADE on delete)
- [ ] FK: sessions.empleador_id → empleadores.id (CASCADE on delete)
- [ ] Unique constraint: empleadores.email
- [ ] Check constraint: ofertas.expires_at > created_at
- [ ] Check constraint: salario_min < salario_max (si aplica)

---

## 🔐 **FASE 2: AUTENTICACIÓN Y AUTORIZACIÓN**

### 2.1 Sistema de Autenticación de Empleadores
- [ ] Implementar bcrypt/argon2 para hash de passwords
- [ ] Crear endpoint POST /api/auth/register (registro empleadores)
- [ ] Crear endpoint POST /api/auth/login (login empleadores)
- [ ] Crear endpoint POST /api/auth/logout
- [ ] Crear endpoint POST /api/auth/refresh-token
- [ ] Implementar generación de JWT tokens o sessions
- [ ] Configurar duración de sesiones (ej: 7 días)
- [ ] Implementar "Remember Me" opcional

### 2.2 Middleware de Autenticación
- [ ] Crear middleware para verificar token/sesión
- [ ] Implementar extracción de usuario desde token
- [ ] Manejar tokens expirados (redirect a login)
- [ ] Proteger rutas de empleador (/empleador/*)

### 2.3 Recuperación de Contraseña
- [ ] Crear endpoint POST /api/auth/forgot-password
- [ ] Generar tokens de reseteo (expiran en 1 hora)
- [ ] Enviar email con link de reseteo
- [ ] Crear endpoint POST /api/auth/reset-password
- [ ] Validar token de reseteo
- [ ] Actualizar contraseña y invalidar token

### 2.4 Verificación de Email
- [ ] Enviar email de verificación al registrar
- [ ] Crear endpoint GET /api/auth/verify-email?token=xxx
- [ ] Marcar empleador como verificado
- [ ] Opcional: requerir verificación para publicar ofertas

---

## 📁 **FASE 3: ALMACENAMIENTO DE ARCHIVOS**

### 3.1 Configuración de Storage
- [ ] Elegir servicio: AWS S3, Supabase Storage, Cloudinary
- [ ] Configurar buckets/containers:
  * `cvs-uploads` (privado)
  * `company-logos` (público, opcional)
- [ ] Configurar políticas de acceso (private para CVs)
- [ ] Implementar signed URLs para acceso temporal a CVs

### 3.2 Subida de CVs
- [ ] Crear endpoint POST /api/upload/cv
- [ ] Validar tamaño máximo (5MB)
- [ ] Validar formato (PDF, DOC, DOCX)
- [ ] Sanitizar nombre de archivo
- [ ] Generar nombre único (UUID + extensión)
- [ ] Subir a storage
- [ ] Devolver URL o ID del archivo

### 3.3 Seguridad de Archivos
- [ ] Escaneo de virus (ClamAV o servicio externo)
- [ ] Rate limiting en subida de archivos
- [ ] Validación de Content-Type real (no solo extensión)
- [ ] Eliminar metadata EXIF de imágenes (si aplica)
- [ ] Configurar CORS apropiadamente

### 3.4 Gestión de Archivos
- [ ] Crear job para eliminar CVs huérfanos (sin postulación)
- [ ] Crear job para eliminar CVs antiguos (ej: 90 días)
- [ ] Implementar backup de archivos críticos
- [ ] Monitorear uso de almacenamiento

---

## 📧 **FASE 4: SISTEMA DE EMAILS**

### 4.1 Configuración de Email Provider
- [ ] Elegir servicio: SendGrid, Mailgun, AWS SES, Resend
- [ ] Configurar dominio y DNS (SPF, DKIM, DMARC)
- [ ] Crear templates de emails con diseño responsive

### 4.2 Emails Transaccionales
- [ ] Email de bienvenida al registrar empleador
- [ ] Email de verificación de cuenta
- [ ] Email de reseteo de contraseña
- [ ] Email de confirmación al publicar oferta
- [ ] Email de notificación de nueva postulación
- [ ] Email a candidato confirmando postulación enviada
- [ ] Email de oferta próxima a expirar (7 días antes)

### 4.3 Templates de Email
```html
- [ ] template-welcome.html
- [ ] template-verify-email.html
- [ ] template-reset-password.html
- [ ] template-new-application.html (a empleador)
- [ ] template-application-received.html (a candidato)
- [ ] template-offer-expiring.html
```

### 4.4 Cola de Emails
- [ ] Implementar sistema de cola (Bull/BullMQ, Redis)
- [ ] Procesar envíos de manera asíncrona
- [ ] Reintentar envíos fallidos (3 intentos)
- [ ] Logging de emails enviados/fallidos
- [ ] Webhook para tracking (aperturas, clicks)

---

## 🔌 **FASE 5: API ENDPOINTS**

### 5.1 Endpoints Públicos (Candidatos)

#### Ofertas
```typescript
- [ ] GET /api/ofertas
      Query params: ?page, ?limit, ?categoria, ?tipo_jornada, ?comuna, ?search
      Response: { ofertas: [], total, page, pages }

- [ ] GET /api/ofertas/:id
      Response: { oferta: {...} }

- [ ] GET /api/ofertas/mapa
      Response: { ofertas: [{ id, titulo, lat, lng, ... }] }
```

#### Postulaciones
```typescript
- [ ] POST /api/postulaciones
      Body: { oferta_id, nombre?, email?, cv_file }
      Validations: CV required, email format, rate limit
      Response: { success: true, postulacion_id }
```

#### Búsqueda
```typescript
- [ ] GET /api/search
      Query: ?q=keyword&filters=...
      Response: { results: [], total, suggestions: [] }

- [ ] GET /api/search/autocomplete?q=keyword
      Response: { suggestions: [] }
```

### 5.2 Endpoints Protegidos (Empleadores)

#### Gestión de Ofertas
```typescript
- [ ] POST /api/empleador/ofertas
      Headers: Authorization: Bearer <token>
      Body: { titulo, descripcion, comuna, tipo_jornada, ... }
      Response: { oferta: {...} }

- [ ] GET /api/empleador/ofertas
      Response: { ofertas: [] }

- [ ] GET /api/empleador/ofertas/:id
      Response: { oferta: {...} }

- [ ] PUT /api/empleador/ofertas/:id
      Body: { campos a actualizar }
      Response: { oferta: {...} }

- [ ] DELETE /api/empleador/ofertas/:id
      Response: { success: true }

- [ ] PATCH /api/empleador/ofertas/:id/toggle
      Toggle activa/inactiva
      Response: { oferta: {...} }
```

#### Postulaciones
```typescript
- [ ] GET /api/empleador/ofertas/:id/postulaciones
      Response: { postulaciones: [] }

- [ ] GET /api/empleador/postulaciones/:id
      Response: { postulacion: {...}, cv_download_url }

- [ ] PATCH /api/empleador/postulaciones/:id/estado
      Body: { estado: 'revisada' | 'rechazada' }
      Response: { postulacion: {...} }
```

#### Dashboard
```typescript
- [ ] GET /api/empleador/dashboard/stats
      Response: {
        total_ofertas,
        ofertas_activas,
        total_postulaciones,
        postulaciones_nuevas,
        vistas_ultimo_mes
      }
```

#### Perfil
```typescript
- [ ] GET /api/empleador/profile
      Response: { empleador: {...} }

- [ ] PUT /api/empleador/profile
      Body: { nombre_empresa, telefono, ... }
      Response: { empleador: {...} }

- [ ] POST /api/empleador/change-password
      Body: { current_password, new_password }
      Response: { success: true }
```

---

## 🛡️ **FASE 6: SEGURIDAD**

### 6.1 Validaciones del Lado del Servidor
- [ ] Validar todos los inputs (usar Zod o Joi)
- [ ] Sanitizar HTML (prevenir XSS)
- [ ] Validar tamaños de payload
- [ ] Validar tipos de datos
- [ ] Implementar whitelist de caracteres permitidos

### 6.2 Rate Limiting
```typescript
- [ ] Global rate limit: 100 req/min por IP
- [ ] Login rate limit: 5 intentos/15min por IP
- [ ] Upload rate limit: 3 CVs/hora por IP
- [ ] Postulación rate limit: 1 postulación/minuto por IP
- [ ] Búsqueda rate limit: 30 búsquedas/min por IP
```

### 6.3 Protección contra Ataques
- [ ] Implementar CSRF protection
- [ ] Headers de seguridad (helmet.js):
  * X-Frame-Options: DENY
  * X-Content-Type-Options: nosniff
  * Strict-Transport-Security
  * Content-Security-Policy
- [ ] SQL injection prevention (usar ORM/query builders)
- [ ] Prevenir Path Traversal en uploads
- [ ] Implementar CAPTCHA en formularios sensibles

### 6.4 Autenticación y Sesiones
- [ ] HTTPOnly cookies para tokens
- [ ] Secure flag en producción (HTTPS)
- [ ] SameSite=Strict para CSRF protection
- [ ] Rotar tokens de sesión periódicamente
- [ ] Invalidar todas las sesiones al cambiar password

### 6.5 Logging y Auditoría
- [ ] Logging de intentos de login fallidos
- [ ] Logging de acciones administrativas
- [ ] Logging de accesos a datos sensibles (CVs)
- [ ] Logging de errores y excepciones
- [ ] No loggear datos sensibles (passwords, tokens)

---

## ⚡ **FASE 7: PERFORMANCE Y ESCALABILIDAD**

### 7.1 Caché
```typescript
- [ ] Redis para caché de sesiones
- [ ] Caché de listado de ofertas (TTL: 5 min)
- [ ] Caché de estadísticas del dashboard (TTL: 15 min)
- [ ] Caché de búsquedas frecuentes (TTL: 10 min)
- [ ] Invalidar caché al crear/actualizar ofertas
```

### 7.2 Optimización de Base de Datos
- [ ] Índices en columnas de búsqueda frecuente:
  * ofertas(activa, created_at)
  * ofertas(comuna)
  * ofertas(categoria)
  * ofertas(empleador_id, created_at)
  * postulaciones(oferta_id, created_at)
- [ ] Índice GiST para búsquedas geográficas (lat/lng)
- [ ] Índice GIN para búsqueda full-text en descripción
- [ ] EXPLAIN ANALYZE para queries lentas

### 7.3 Paginación del Lado del Servidor
- [ ] Implementar cursor-based pagination para listas grandes
- [ ] Limit por defecto: 20 items
- [ ] Máximo permitido: 100 items
- [ ] Devolver metadatos de paginación

### 7.4 CDN y Assets
- [ ] Servir assets estáticos desde CDN
- [ ] Comprimir imágenes (WebP, lazy loading)
- [ ] Minificar CSS/JS en producción
- [ ] Implementar cache headers apropiados

### 7.5 Background Jobs
```typescript
- [ ] Job: Expirar ofertas antiguas (cron diario)
- [ ] Job: Enviar emails de ofertas por expirar (cron diario)
- [ ] Job: Limpiar sesiones expiradas (cron diario)
- [ ] Job: Limpiar CVs antiguos (cron semanal)
- [ ] Job: Generar reportes mensuales (cron mensual)
- [ ] Job: Backup de base de datos (cron diario)
```

---

## 🧪 **FASE 8: TESTING**

### 8.1 Unit Tests
```typescript
- [ ] Tests para validaciones (validations.ts)
- [ ] Tests para utilidades (fecha, formato, etc)
- [ ] Tests para lógica de negocio
- [ ] Coverage objetivo: >80%
```

### 8.2 Integration Tests
```typescript
- [ ] Tests de API endpoints:
  * POST /api/auth/register
  * POST /api/auth/login
  * POST /api/postulaciones
  * POST /api/empleador/ofertas
  * GET /api/ofertas
- [ ] Tests de autenticación y autorización
- [ ] Tests de rate limiting
- [ ] Tests de validaciones
```

### 8.3 E2E Tests
```typescript
- [ ] Flow: Registro de empleador
- [ ] Flow: Publicar oferta
- [ ] Flow: Postular a oferta
- [ ] Flow: Ver postulaciones
- [ ] Flow: Búsqueda de ofertas
```

### 8.4 Load Testing
- [ ] Test de carga para endpoints críticos
- [ ] Objetivo: Soportar 1000 usuarios concurrentes
- [ ] Identificar bottlenecks
- [ ] Optimizar queries lentas

---

## 📊 **FASE 9: MONITORING Y OBSERVABILIDAD**

### 9.1 Application Monitoring
- [ ] Implementar APM (New Relic, Datadog, o similar)
- [ ] Tracking de errores (Sentry)
- [ ] Métricas de performance (response times)
- [ ] Monitoreo de uptime (UptimeRobot)

### 9.2 Logs Centralizados
- [ ] Agregación de logs (ELK Stack, Datadog)
- [ ] Estructura de logs consistente (JSON)
- [ ] Niveles de log apropiados (error, warn, info, debug)
- [ ] Correlation IDs para tracing

### 9.3 Alertas
```typescript
- [ ] Alerta: Error rate > 5%
- [ ] Alerta: Response time > 2s
- [ ] Alerta: CPU > 80%
- [ ] Alerta: Memory > 85%
- [ ] Alerta: Disco > 90%
- [ ] Alerta: Base de datos down
- [ ] Alerta: Email service down
```

### 9.4 Dashboards
- [ ] Dashboard de métricas en tiempo real
- [ ] Dashboard de uso (ofertas publicadas, postulaciones)
- [ ] Dashboard de errores
- [ ] Dashboard de performance

---

## 🚀 **FASE 10: DEPLOYMENT Y DEVOPS**

### 10.1 Infraestructura
- [ ] Configurar hosting (Vercel, Railway, Render, AWS)
- [ ] Configurar base de datos en producción
- [ ] Configurar Redis para caché/sessions
- [ ] Configurar storage para archivos
- [ ] Configurar dominio y DNS

### 10.2 Variables de Entorno
```bash
- [ ] DATABASE_URL
- [ ] REDIS_URL
- [ ] JWT_SECRET
- [ ] SESSION_SECRET
- [ ] EMAIL_API_KEY
- [ ] STORAGE_ACCESS_KEY
- [ ] STORAGE_SECRET_KEY
- [ ] STORAGE_BUCKET_NAME
- [ ] FRONTEND_URL
- [ ] API_BASE_URL
- [ ] NODE_ENV
```

### 10.3 CI/CD Pipeline
```yaml
- [ ] GitHub Actions o similar
- [ ] Pipeline stages:
  1. Lint (ESLint)
  2. Type Check (TypeScript)
  3. Unit Tests
  4. Integration Tests
  5. Build
  6. Deploy to Staging
  7. E2E Tests en Staging
  8. Deploy to Production
```

### 10.4 Backup y Disaster Recovery
- [ ] Backup diario de base de datos
- [ ] Backup semanal de archivos
- [ ] Plan de recuperación documentado
- [ ] Testing de backups mensual
- [ ] Retention: 30 días

---

## 📚 **FASE 11: DOCUMENTACIÓN**

### 11.1 Documentación de API
- [ ] Documentación OpenAPI/Swagger
- [ ] Ejemplos de requests/responses
- [ ] Códigos de error documentados
- [ ] Rate limits documentados
- [ ] Autenticación documentada

### 11.2 Documentación Interna
- [ ] README completo del proyecto
- [ ] Guía de setup para desarrollo
- [ ] Arquitectura del sistema
- [ ] Flujos de datos
- [ ] Decisiones de diseño (ADRs)

### 11.3 Guías de Usuario
- [ ] Manual para empleadores
- [ ] Manual para candidatos
- [ ] FAQs
- [ ] Troubleshooting común

---

## 🎯 **FASE 12: FEATURES ADICIONALES (OPCIONAL)**

### 12.1 Panel de Administración
- [ ] Vista de todas las ofertas
- [ ] Moderación de contenido
- [ ] Gestión de usuarios
- [ ] Estadísticas globales
- [ ] Logs de actividad

### 12.2 Notificaciones
- [ ] Notificaciones email para nuevas ofertas (suscripción)
- [ ] Alertas de empleo por categoría
- [ ] Notificaciones push (web push)

### 12.3 Analytics
- [ ] Tracking de vistas de ofertas
- [ ] Funnel de conversión (vista → postulación)
- [ ] Métricas de engagement
- [ ] Dashboard de analytics para empleadores

### 12.4 Mejoras de Búsqueda
- [ ] Búsqueda fuzzy (typo tolerance)
- [ ] Búsqueda por proximidad geográfica (radius)
- [ ] Filtros avanzados (salario, experiencia)
- [ ] Ordenamiento por relevancia (scoring)

### 12.5 Social Features
- [ ] Compartir ofertas en redes sociales
- [ ] Sistema de reviews de empresas
- [ ] Empresas destacadas (featured)

---

## ✅ **PRIORIZACIÓN RECOMENDADA**

### **Sprint 1 (Crítico - 2 semanas)**
1. Base de datos y migraciones (Fase 1)
2. Autenticación básica (Fase 2.1, 2.2)
3. API de ofertas CRUD (Fase 5.2)
4. Sistema de almacenamiento de CVs (Fase 3.1, 3.2)
5. Endpoint de postulación (Fase 5.1)

### **Sprint 2 (Esencial - 2 semanas)**
6. Sistema de emails básico (Fase 4.1, 4.2)
7. Recuperación de contraseña (Fase 2.3)
8. Dashboard de empleador (Fase 5.2)
9. Rate limiting básico (Fase 6.2)
10. Variables de entorno y deployment (Fase 10.1, 10.2)

### **Sprint 3 (Importante - 1-2 semanas)**
11. Seguridad completa (Fase 6)
12. Caché y performance (Fase 7.1, 7.2)
13. Background jobs críticos (Fase 7.5)
14. Monitoring básico (Fase 9.1, 9.2)
15. Testing core functionality (Fase 8.1, 8.2)

### **Sprint 4 (Pulido - 1 semana)**
16. E2E tests (Fase 8.3)
17. Documentación API (Fase 11.1)
18. CI/CD pipeline (Fase 10.3)
19. Backup y recovery (Fase 10.4)
20. Features adicionales (Fase 12 - opcional)

---

## 📈 **ESTIMACIÓN TOTAL**

**Tiempo Estimado Desarrollo Completo:** 6-8 semanas (1 desarrollador full-time)

**MVP Funcional (Sprints 1-2):** 4 semanas
**Producción-Ready (Sprints 1-3):** 6 semanas
**Completamente Pulido (Sprints 1-4):** 8 semanas

---

## 🔧 **STACK TECNOLÓGICO RECOMENDADO**

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Astro API routes + tRPC (type-safe) o Express
- **ORM:** Prisma o Drizzle ORM
- **Validation:** Zod
- **Auth:** jose (JWT) o Lucia Auth

### Base de Datos
- **Primary:** PostgreSQL 15+ (Supabase recomendado)
- **Cache:** Redis (Upstash para serverless)

### Storage
- **Files:** Supabase Storage o AWS S3

### Email
- **Provider:** Resend (moderno, developer-friendly)

### Monitoring
- **Errors:** Sentry
- **APM:** Vercel Analytics o Datadog

### Testing
- **Unit:** Vitest
- **E2E:** Playwright

---

## 💡 **NOTAS FINALES**

1. **Comienza por el MVP:** No intentes hacer todo a la vez
2. **Itera:** Lanza rápido, mejora después
3. **Mide:** Implementa analytics desde el día 1
4. **Seguridad primero:** No comprometas la seguridad por velocidad
5. **Documenta:** El código se lee más veces de las que se escribe

**Este checklist está listo para ser usado como referencia durante todo el desarrollo.**
