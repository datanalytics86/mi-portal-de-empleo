import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const ofertaId = formData.get('oferta_id') as string;
    const nombreCandidato = formData.get('nombre_candidato') as string || null;
    const emailCandidato = formData.get('email_candidato') as string || null;
    const cvFile = formData.get('cv') as File;
    const aceptaPrivacidad = formData.get('acepta_privacidad');

    // Validaciones básicas
    if (!ofertaId) {
      return new Response(JSON.stringify({ error: 'ID de oferta requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!cvFile || cvFile.size === 0) {
      return new Response(JSON.stringify({ error: 'CV requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (aceptaPrivacidad !== 'on') {
      return new Response(
        JSON.stringify({ error: 'Debes aceptar la política de privacidad' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(cvFile.type)) {
      return new Response(
        JSON.stringify({ error: 'Solo se aceptan archivos PDF o Word' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar tamaño
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (cvFile.size > maxSize) {
      return new Response(JSON.stringify({ error: 'El archivo no puede superar 5MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener IP del usuario
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Anti-spam: verificar número de postulaciones por IP en la última hora
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentPostulations } = await supabase
      .from('postulaciones')
      .select('id')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo);

    if (recentPostulations && recentPostulations.length >= 3) {
      return new Response(
        JSON.stringify({ error: 'Has alcanzado el límite de postulaciones por hora' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const extension = cvFile.name.split('.').pop();
    const fileName = `${timestamp}_${randomId}.${extension}`;
    const filePath = `cvs/${fileName}`;

    // Subir archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(filePath, cvFile, {
        contentType: cvFile.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return new Response(JSON.stringify({ error: 'Error al subir el archivo' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Crear postulación en la base de datos
    const { error: insertError } = await supabase.from('postulaciones').insert({
      oferta_id: ofertaId,
      nombre_candidato: nombreCandidato,
      email_candidato: emailCandidato,
      cv_url: filePath,
      ip_address: ipAddress,
    });

    if (insertError) {
      console.error('Error inserting postulacion:', insertError);

      // Eliminar archivo subido si falla la inserción
      await supabase.storage.from('cvs').remove([filePath]);

      return new Response(JSON.stringify({ error: 'Error al crear la postulación' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Postulación enviada correctamente' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in postular API:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
