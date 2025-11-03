/**
 * Utilidades para envío de emails con Resend
 *
 * Maneja el envío de notificaciones por correo electrónico
 * para postulaciones, bienvenidas y alertas
 */

import { Resend } from 'resend'

const resendApiKey = import.meta.env.RESEND_API_KEY
const fromEmail = import.meta.env.FROM_EMAIL || 'Portal Empleos Chile <onboarding@resend.dev>'

if (!resendApiKey) {
  console.warn('⚠️ RESEND_API_KEY no configurado. Los emails no se enviarán.')
}

const resend = resendApiKey ? new Resend(resendApiKey) : null

/**
 * Envía email de confirmación de postulación al candidato
 */
export async function enviarEmailPostulacion(data: {
  nombrePostulante: string
  emailPostulante: string
  tituloOferta: string
  empresa: string
}) {
  if (!resend) {
    console.warn('Resend no configurado, email no enviado')
    return
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.emailPostulante,
      subject: `Postulación recibida: ${data.tituloOferta}`,
      html: templatePostulacionCandidato(data)
    })

    console.log(`✅ Email enviado a ${data.emailPostulante}`)
  } catch (error) {
    console.error('Error enviando email al postulante:', error)
  }
}

/**
 * Envía email de notificación al empleador sobre nueva postulación
 */
export async function enviarEmailEmpleador(data: {
  nombrePostulante: string
  emailEmpleador: string
  tituloOferta: string
  empresa: string
  dashboardUrl: string
}) {
  if (!resend) {
    console.warn('Resend no configurado, email no enviado')
    return
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.emailEmpleador,
      subject: `Nueva postulación: ${data.tituloOferta}`,
      html: templateNuevaPostulacion(data)
    })

    console.log(`✅ Email enviado a empleador ${data.emailEmpleador}`)
  } catch (error) {
    console.error('Error enviando email al empleador:', error)
  }
}

/**
 * Envía email de bienvenida a nuevo empleador
 */
export async function enviarEmailBienvenida(data: {
  nombreEmpleador: string
  emailEmpleador: string
  empresa: string
}) {
  if (!resend) {
    console.warn('Resend no configurado, email no enviado')
    return
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.emailEmpleador,
      subject: '¡Bienvenido a Portal de Empleos Chile!',
      html: templateBienvenida(data)
    })

    console.log(`✅ Email de bienvenida enviado a ${data.emailEmpleador}`)
  } catch (error) {
    console.error('Error enviando email de bienvenida:', error)
  }
}

// ========================================
// TEMPLATES DE EMAIL
// ========================================

/**
 * Template: Confirmación de postulación para candidato
 */
function templatePostulacionCandidato(data: {
  nombrePostulante: string
  tituloOferta: string
  empresa: string
}) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Postulación Recibida</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ ¡Postulación Recibida!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${data.nombrePostulante}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Tu postulación a la oferta <strong>${data.tituloOferta}</strong> en <strong>${data.empresa}</strong> ha sido recibida exitosamente.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        <strong>¿Qué sigue?</strong><br>
        El empleador revisará tu perfil y CV. Si tu perfil es seleccionado, te contactarán directamente al correo que proporcionaste.
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      ¡Mucha suerte en tu proceso!<br>
      <strong>Portal de Empleos Chile</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>Este es un correo automático, por favor no responder.</p>
    <p>&copy; ${new Date().getFullYear()} Portal de Empleos Chile. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `
}

/**
 * Template: Notificación de nueva postulación para empleador
 */
function templateNuevaPostulacion(data: {
  nombrePostulante: string
  tituloOferta: string
  empresa: string
  dashboardUrl: string
}) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Postulación</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Nueva Postulación</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">¡Excelentes noticias!</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${data.nombrePostulante}</strong> se ha postulado a tu oferta <strong>${data.tituloOferta}</strong>.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
        Revisa su perfil y CV en tu dashboard:
      </p>
      <a href="${data.dashboardUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Ver Dashboard
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Recuerda revisar las postulaciones regularmente para no perder candidatos valiosos.<br>
      <strong>Portal de Empleos Chile</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>Este es un correo automático, por favor no responder.</p>
    <p>&copy; ${new Date().getFullYear()} Portal de Empleos Chile. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `
}

/**
 * Template: Email de bienvenida para nuevo empleador
 */
function templateBienvenida(data: {
  nombreEmpleador: string
  empresa: string
}) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido! 🎊</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${data.nombreEmpleador}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      ¡Gracias por registrar <strong>${data.empresa}</strong> en Portal de Empleos Chile!
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #10b981; margin-top: 0;">Próximos pasos:</h3>
      <ol style="font-size: 14px; color: #6b7280; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Publica tu primera oferta de empleo</li>
        <li style="margin-bottom: 10px;">Recibe postulaciones de candidatos calificados</li>
        <li style="margin-bottom: 10px;">Revisa CVs y contacta directamente</li>
        <li>¡Encuentra al candidato ideal!</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${import.meta.env.PUBLIC_SITE_URL || 'https://mi-portal-de-empleo.vercel.app'}/empleador/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Ir a mi Dashboard
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Si tienes alguna pregunta, no dudes en contactarnos.<br>
      <strong>Portal de Empleos Chile</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>&copy; ${new Date().getFullYear()} Portal de Empleos Chile. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `
}
