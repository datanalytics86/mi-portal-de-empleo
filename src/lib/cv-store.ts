import { put } from '@vercel/blob';
import { createServiceClient } from './supabase';
import { log } from './observability';

export async function storeCvFile(opts: {
  path: string;
  buffer: ArrayBuffer;
  contentType: string;
}): Promise<string> {
  const token = import.meta.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const blob = await put(opts.path, Buffer.from(opts.buffer), {
      access: 'private',
      contentType: opts.contentType,
      token,
    });
    return blob.url;
  }

  const service = createServiceClient();
  const { data, error } = await service.storage.from('cvs').upload(opts.path, opts.buffer, {
    contentType: opts.contentType,
    upsert: false,
  });
  if (error || !data) {
    log.error('cv_store.upload_failed', { error: error?.message ?? 'no data' });
    throw new Error(error?.message || 'cv upload failed');
  }
  return data.path;
}
