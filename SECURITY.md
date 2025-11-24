# Política de Seguridad

## Versiones Soportadas

Las siguientes versiones del Portal de Empleo Chile reciben actualizaciones de seguridad:

| Versión | Soportada          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reportar una Vulnerabilidad

La seguridad de nuestros usuarios es nuestra máxima prioridad. Agradecemos a la comunidad de seguridad por ayudarnos a mantener el Portal de Empleo Chile seguro.

### Proceso de Divulgación Responsable

Si descubres una vulnerabilidad de seguridad, por favor sigue estos pasos:

1. **NO** crees un issue público en GitHub
2. Envía un email a: **security@example.com** con:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducirla
   - Impacto potencial
   - Sugerencias de mitigación (si las tienes)
   - Tu información de contacto

3. Espera nuestra respuesta (dentro de 48 horas)
4. Trabaja con nosotros de forma confidencial hasta que se publique un fix

### Qué Esperar

- **Confirmación**: Responderemos dentro de 48 horas confirmando la recepción
- **Actualización**: Te mantendremos informado sobre el progreso cada 5-7 días
- **Resolución**: Trabajaremos en un fix prioritario
- **Divulgación**: Coordinaremos la divulgación pública contigo
- **Reconocimiento**: Te daremos crédito en el changelog (si lo deseas)

### Vulnerabilidades Elegibles

Reportamos vulnerabilidades relacionadas con:

- ✅ SQL Injection
- ✅ Cross-Site Scripting (XSS)
- ✅ Cross-Site Request Forgery (CSRF)
- ✅ Authentication/Authorization bypass
- ✅ Remote Code Execution (RCE)
- ✅ Server-Side Request Forgery (SSRF)
- ✅ Exposición de datos sensibles
- ✅ Path Traversal
- ✅ File Upload vulnerabilities
- ✅ Rate limiting bypass

### Fuera de Alcance

Las siguientes NO son consideradas vulnerabilidades:

- ❌ Clickjacking en páginas sin autenticación
- ❌ SPF/DKIM/DMARC de email
- ❌ Falta de best practices (sin impacto de seguridad)
- ❌ Vulnerabilidades en dependencias obsoletas (sin PoC)
- ❌ Social engineering
- ❌ Ataques de fuerza bruta sin bypass de rate limiting
- ❌ Contenido generado por usuarios (spam)

## Medidas de Seguridad Implementadas

### Protección de Datos

#### Almacenamiento de IPs
- **NO almacenamos IPs directamente**: Las direcciones IP se hashean con SHA-256 antes de almacenarlas
- **Propósito**: Únicamente para prevenir spam y abuso
- **Retención**: Las IPs hasheadas se eliminan después de 90 días

#### Datos de Candidatos
- **Mínimos datos requeridos**: Solo nombre (opcional), email (opcional) y CV
- **Sin registro obligatorio**: Los candidatos pueden postular sin crear cuenta
- **Eliminación automática**: CVs y datos se eliminan después de 90 días
- **Política de privacidad**: Claramente visible y requerida antes de postular

### Seguridad de Aplicación

#### Validación de Archivos
```typescript
// Validamos MIME type Y magic numbers (contenido real)
- Solo PDF y Word (.doc, .docx)
- Máximo 5MB por archivo
- Escaneo de magic numbers para prevenir archivos maliciosos
- Nombres únicos generados server-side
```

#### Rate Limiting
```typescript
// Múltiples capas de protección
- 3 postulaciones por IP por hora
- 5 postulaciones por email por día
- 1 postulación por oferta por hora
- 100 uploads globales por minuto
```

#### Autenticación y Autorización
- Autenticación via Supabase Auth (bcrypt para passwords)
- Row Level Security (RLS) en PostgreSQL
- Políticas granulares por tabla
- Session tokens con expiración automática

#### Headers de Seguridad
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

#### Sanitización de Inputs
- Todos los inputs se sanitizan con DOMPurify
- Validación con Zod schemas
- Escape de caracteres especiales en queries SQL (via Supabase)

### Infrastructure Security

#### Supabase (Backend)
- RLS policies activas en todas las tablas
- Conexiones encriptadas (TLS 1.3)
- Backups automáticos diarios
- Logs de auditoría habilitados

#### Vercel (Frontend)
- HTTPS obligatorio
- Automatic DDoS protection
- Edge network global
- Isolation entre deployments

### Dependencias

Monitoreamos vulnerabilidades en dependencias con:

- Dependabot (GitHub)
- `npm audit` en CI/CD
- Actualizaciones automáticas de patches de seguridad

## Mejores Prácticas para Usuarios

### Para Candidatos

- ✅ Nunca compartas tu contraseña (aunque no la pedimos)
- ✅ Usa emails únicos para identificar tus postulaciones
- ✅ Revisa la política de privacidad antes de postular
- ✅ No incluyas datos sensibles en tu CV (RUT, dirección completa, etc.)

### Para Empleadores

- ✅ Usa contraseñas fuertes y únicas
- ✅ Habilita autenticación de dos factores (2FA) cuando esté disponible
- ✅ Descarga y elimina CVs que ya procesaste
- ✅ No compartas tu cuenta con otros
- ✅ Cierra sesión en computadoras compartidas
- ✅ Reporta actividad sospechosa inmediatamente

## Actualizaciones de Seguridad

### Suscribirse a Alertas

Para recibir notificaciones de actualizaciones de seguridad:

1. Watch este repositorio en GitHub
2. Selecciona "Custom" → "Security alerts"
3. O suscríbete a nuestro feed RSS de releases

### Historial de Seguridad

#### 2025-01

- **v1.0.0**: Lanzamiento inicial con las siguientes medidas:
  - Hashing de IPs
  - Rate limiting multi-capa
  - Validación de archivos por magic numbers
  - RLS policies en Supabase
  - Headers de seguridad

## Cumplimiento y Regulaciones

### Chile

- **Ley 19.628**: Protección de la Vida Privada
  - Consentimiento explícito para recolección de datos
  - Derecho de acceso, modificación y eliminación
  - Retención limitada de datos personales

- **Ley 21.459**: Marco de Ciberseguridad (en cumplimiento)

### Internacionales

- **GDPR** (Europa): Cumplimiento parcial para usuarios internacionales
- **CCPA** (California): Derechos de privacidad respetados

## Auditorías

### Última Auditoría

- **Fecha**: Pendiente (primera auditoría planificada para Q2 2025)
- **Alcance**: Aplicación web, APIs, base de datos
- **Auditor**: Por determinar

### Próxima Auditoría

Planificamos auditorías de seguridad anuales con terceros independientes.

## Recursos Adicionales

### Para Desarrolladores

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

### Para Usuarios

- [Guía de Seguridad en Internet (CSIRT Chile)](https://www.csirt.gob.cl/)
- [Buenas prácticas de contraseñas](https://www.sernac.cl/guia-seguridad-digital/)

## Contacto

- **Email de seguridad**: security@example.com
- **PGP Key**: [Disponible próximamente]
- **Response time**: 48 horas máximo

## Bug Bounty Program

Actualmente NO tenemos un programa de bug bounty formal. Sin embargo:

- Reconocemos públicamente a los investigadores de seguridad
- Consideramos recompensas caso por caso para vulnerabilidades críticas
- Planeamos lanzar un programa formal en el futuro

---

**Última actualización**: 2025-11-24

Gracias por ayudarnos a mantener seguro el Portal de Empleo Chile! 🔒
