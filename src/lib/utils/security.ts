import { createHash } from 'crypto';

/**
 * Hashea una dirección IP para almacenamiento seguro
 * Usa SHA-256 para crear un hash no reversible
 */
export function hashIP(ip: string, salt: string = process.env.HASH_SALT || ''): string {
  const hash = createHash('sha256');
  hash.update(ip + salt);
  return hash.digest('hex');
}

/**
 * Obtiene la IP real del cliente considerando proxies y load balancers
 */
export function getClientIP(request: Request): string {
  // Headers comunes de proxies
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare

  // Prioridad: CF > Real-IP > Forwarded-For (primera IP) > default
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0] || '0.0.0.0';
  }

  return '0.0.0.0';
}

/**
 * Valida el contenido real de un archivo basándose en magic numbers
 * No confía solo en el MIME type que puede ser falsificado
 */
export async function validateFileContent(buffer: ArrayBuffer): Promise<{
  isValid: boolean;
  detectedType?: string;
  error?: string;
}> {
  const uint8Array = new Uint8Array(buffer);

  // Magic numbers de tipos de archivo permitidos
  const magicNumbers = {
    pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
    doc: [0xD0, 0xCF, 0x11, 0xE0], // DOC (old format)
    docx: [0x50, 0x4B, 0x03, 0x04], // DOCX (ZIP container)
  };

  // Verificar PDF
  if (
    uint8Array[0] === magicNumbers.pdf[0] &&
    uint8Array[1] === magicNumbers.pdf[1] &&
    uint8Array[2] === magicNumbers.pdf[2] &&
    uint8Array[3] === magicNumbers.pdf[3]
  ) {
    return { isValid: true, detectedType: 'pdf' };
  }

  // Verificar DOC (old format)
  if (
    uint8Array[0] === magicNumbers.doc[0] &&
    uint8Array[1] === magicNumbers.doc[1] &&
    uint8Array[2] === magicNumbers.doc[2] &&
    uint8Array[3] === magicNumbers.doc[3]
  ) {
    return { isValid: true, detectedType: 'doc' };
  }

  // Verificar DOCX (ZIP container)
  if (
    uint8Array[0] === magicNumbers.docx[0] &&
    uint8Array[1] === magicNumbers.docx[1] &&
    uint8Array[2] === magicNumbers.docx[2] &&
    uint8Array[3] === magicNumbers.docx[3]
  ) {
    // Verificar que sea realmente un DOCX (contiene word/ en el ZIP)
    const textDecoder = new TextDecoder('utf-8');
    const header = textDecoder.decode(uint8Array.slice(0, 100));
    if (header.includes('word/')) {
      return { isValid: true, detectedType: 'docx' };
    }
  }

  return {
    isValid: false,
    error: 'Tipo de archivo no permitido. Solo se aceptan PDF o Word (.doc, .docx)',
  };
}

/**
 * Genera un nombre único para archivos subidos
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'pdf';

  return `cv_${timestamp}_${randomStr}.${extension}`;
}

/**
 * Sanitiza el nombre de archivo para evitar path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Verifica si una solicitud excede los límites de rate limiting
 */
export interface RateLimitConfig {
  max: number;
  window: number; // segundos
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Clase simple para rate limiting en memoria
 * Para producción, usar Redis o similar
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();

  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const record = this.requests.get(key);

    // Si no hay registro o el window expiró, crear nuevo
    if (!record || record.resetAt < now) {
      const resetAt = now + config.window * 1000;
      this.requests.set(key, { count: 1, resetAt });

      return {
        allowed: true,
        remaining: config.max - 1,
        resetAt: new Date(resetAt),
      };
    }

    // Incrementar contador
    record.count++;

    // Verificar si excede el límite
    if (record.count > config.max) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(record.resetAt),
      };
    }

    return {
      allowed: true,
      remaining: config.max - record.count,
      resetAt: new Date(record.resetAt),
    };
  }

  // Limpiar registros expirados periódicamente
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (record.resetAt < now) {
        this.requests.delete(key);
      }
    }
  }
}

// Instancia global del rate limiter
export const rateLimiter = new RateLimiter();

// Limpiar cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}
