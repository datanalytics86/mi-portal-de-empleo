import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  __resetMemoryStoreForTests,
  getPresetConfig,
} from './rate-limit';

describe('getClientIp', () => {
  it('prioriza x-forwarded-for (primer hop)', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 10.0.0.1',
        'cf-connecting-ip': '9.9.9.9',
      },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('usa cf-connecting-ip si no hay x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'cf-connecting-ip': '8.8.8.8' },
    });
    expect(getClientIp(req)).toBe('8.8.8.8');
  });

  it('devuelve unknown sin headers', () => {
    expect(getClientIp(new Request('http://localhost'))).toBe('unknown');
  });
});

describe('checkRateLimit (memory fallback)', () => {
  beforeEach(() => {
    __resetMemoryStoreForTests();
  });

  it('permite hasta el límite del preset y luego bloquea', async () => {
    const cfg = getPresetConfig('auth-login');
    const id = 'test-ip-login';

    for (let i = 0; i < cfg.limit; i++) {
      const r = await checkRateLimit(id, 'auth-login');
      expect(r.success).toBe(true);
      expect(r.backend).toBe('memory');
      expect(r.remaining).toBe(cfg.limit - (i + 1));
    }

    const blocked = await checkRateLimit(id, 'auth-login');
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.limit).toBe(cfg.limit);
  });

  it('aísla presets e identificadores', async () => {
    const a = await checkRateLimit('ip-a', 'postulaciones');
    const b = await checkRateLimit('ip-b', 'postulaciones');
    const c = await checkRateLimit('ip-a', 'auth-registro');
    expect(a.success && b.success && c.success).toBe(true);
    expect(a.remaining).toBe(getPresetConfig('postulaciones').limit - 1);
  });

  it('rateLimitHeaders incluye Retry-After cuando está bloqueado', async () => {
    const cfg = getPresetConfig('auth-registro');
    const id = 'rl-headers';
    for (let i = 0; i < cfg.limit; i++) {
      await checkRateLimit(id, 'auth-registro');
    }
    const blocked = await checkRateLimit(id, 'auth-registro');
    const h = rateLimitHeaders(blocked);
    expect(h['X-RateLimit-Limit']).toBe(String(cfg.limit));
    expect(h['Retry-After']).toBeTruthy();
    expect(Number(h['Retry-After'])).toBeGreaterThan(0);
  });
});
