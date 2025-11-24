import type { APIRoute } from 'astro';
import { PostulacionSchema, CVFileSchema } from '@/lib/validations/schemas';
import { createServerClient } from '@/lib/supabase';
import {
  getClientIP,
  hashIP,
  validateFileContent,
  generateUniqueFilename,
  rateLimiter,
} from '@/lib/utils/security';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Validar Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type debe ser multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Obtener IP del cliente y hashearla
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    // 3. Rate Limiting por IP
    const rateLimitIP = rateLimiter.check(`postular:ip:${ipHash}`, {
      max: parseInt(import.meta.env.RATE_LIMIT_PER_IP_HOUR || '3'),
      window: 3600, // 1 hora
    });

    if (!rateLimitIP.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Has excedido el límite de postulaciones por hora. Intenta más tarde.',
          resetAt: rateLimitIP.resetAt,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(
              (rateLimitIP.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // 4. Parsear FormData
    const formData = await request.formData();
    const nombre = formData.get('nombre')?.toString() || null;
    const email = formData.get('email')?.toString() || null;
    const ofertaId = formData.get('ofertaId')?.toString();
    const acceptPrivacy = formData.get('acceptPrivacy') === 'true';
    const cvFile = formData.get('cv') as File | null;

    // 5. Validar datos del formulario
    const validationResult = PostulacionSchema.safeParse({
      nombre,
      email,
      ofertaId,
      acceptPrivacy,
    });

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Datos inválidos',
          details: validationResult.error.flatten(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Validar archivo CV
    if (!cvFile) {
      return new Response(
        JSON.stringify({ error: 'Debes subir tu CV' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileValidation = CVFileSchema.safeParse({
      name: cvFile.name,
      size: cvFile.size,
      type: cvFile.type,
    });

    if (!fileValidation.success) {
      return new Response(
        JSON.stringify({
          error: 'Archivo inválido',
          details: fileValidation.error.flatten(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Validar contenido real del archivo (magic numbers)
    const fileBuffer = await cvFile.arrayBuffer();
    const contentValidation = await validateFileContent(fileBuffer);

    if (!contentValidation.isValid) {
      return new Response(
        JSON.stringify({ error: contentValidation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 8. Rate limiting por email (si se proporcionó)
    if (email) {
      const emailHash = hashIP(email); // Reutilizamos la función de hash
      const rateLimitEmail = rateLimiter.check(`postular:email:${emailHash}`, {
        max: parseInt(import.meta.env.RATE_LIMIT_PER_EMAIL_DAY || '5'),
        window: 86400, // 24 horas
      });

      if (!rateLimitEmail.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Has excedido el límite de postulaciones diarias con este email.',
            resetAt: rateLimitEmail.resetAt,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(
                (rateLimitEmail.resetAt.getTime() - Date.now()) / 1000
              ).toString(),
            },
          }
        );
      }
    }

    // 9. Verificar que la oferta existe y está activa
    const supabase = createServerClient();
    const { data: oferta, error: ofertaError } = await supabase
      .from('ofertas')
      .select('id, activa, expires_at')
      .eq('id', ofertaId!)
      .single();

    if (ofertaError || !oferta) {
      return new Response(
        JSON.stringify({ error: 'Oferta no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!oferta.activa || new Date(oferta.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Esta oferta ya no está activa' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 10. Verificar si ya postuló a esta oferta (si tiene email)
    if (email) {
      const { data: existingPostulacion } = await supabase
        .from('postulaciones')
        .select('id')
        .eq('oferta_id', ofertaId!)
        .eq('email_candidato', email)
        .single();

      if (existingPostulacion) {
        return new Response(
          JSON.stringify({ error: 'Ya has postulado a esta oferta' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 11. Subir archivo a Supabase Storage
    const fileName = generateUniqueFilename(cvFile.name);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(fileName, fileBuffer, {
        contentType: cvFile.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error al subir CV:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Error al subir el archivo. Intenta nuevamente.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 12. Crear postulación en la base de datos
    const { data: postulacion, error: postulacionError } = await supabase
      .from('postulaciones')
      .insert({
        oferta_id: ofertaId!,
        nombre_candidato: nombre,
        email_candidato: email,
        cv_url: uploadData.path,
        ip_hash: ipHash,
      })
      .select()
      .single();

    if (postulacionError) {
      // Si falla la inserción, eliminar el archivo subido
      await supabase.storage.from('cvs').remove([uploadData.path]);

      console.error('Error al crear postulación:', postulacionError);
      return new Response(
        JSON.stringify({ error: 'Error al crear la postulación. Intenta nuevamente.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 13. Respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Postulación enviada correctamente',
        postulacionId: postulacion.id,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimitIP.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Error en /api/postular:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
