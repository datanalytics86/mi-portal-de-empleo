import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  checkAuthRateLimits,
  normalizeEmailForRateLimit,
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

describe('normalizeEmailForRateLimit', () => {
  it('trim + lowercase', () => {
    expect(normalizeEmailForRateLimit('  Foo@Bar.CL ')).toBe('foo@bar.cl');
  });

  it('rechaza vacío, null y basura', () => {
    expect(normalizeEmailForRateLimit(null)).toBeNull();
    expect(normalizeEmailForRateLimit('')).toBeNull();
    expect(normalizeEmailForRateLimit('   ')).toBeNull();
    expect(normalizeEmailForRateLimit('not-an-email')).toBeNull();
    expect(normalizeEmailForRateLimit('@nodomain')).toBeNull();
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

describe('checkAuthRateLimits (IP + email)', () => {
  beforeEach(() => {
    __resetMemoryStoreForTests();
  });

  it('consume contadores de IP y email por separado', async () => {
    const cfg = getPresetConfig('auth-login');
    const ip = '10.0.0.1';
    const email = 'user@example.com';

    // Agotar el contador de email con distintas IPs
    for (let i = 0; i < cfg.limit; i++) {
      const r = await checkAuthRateLimits({
        ip: `9.9.9.${i}`,
        email,
        preset: 'auth-login',
      });
      expect(r.success).toBe(true);
    }

    // Misma email, nueva IP → bloqueado por email
    const blocked = await checkAuthRateLimits({
      ip: '8.8.8.8',
      email,
      preset: 'auth-login',
    });
    expect(blocked.success).toBe(false);
    expect(blocked.blockedBy).toBe('email');

    // Otra email, IP limpia → OK
    const other = await checkAuthRateLimits({
      ip: '1.1.1.1',
      email: 'otro@example.com',
      preset: 'auth-login',
    });
    expect(other.success).toBe(true);
  });

  it('bloquea por IP aunque el email sea distinto', async () => {
    const cfg = getPresetConfig('auth-login');
    const ip = '203.0.113.50';

    for (let i = 0; i < cfg.limit; i++) {
      const r = await checkAuthRateLimits({
        ip,
        email: `user${i}@example.com`,
        preset: 'auth-login',
      });
      expect(r.success).toBe(true);
    }

    const blocked = await checkAuthRateLimits({
      ip,
      email: 'fresh@example.com',
      preset: 'auth-login',
    });
    expect(blocked.success).toBe(false);
    expect(blocked.blockedBy).toBe('ip');
  });

  it('normaliza email (case) al mismo bucket', async () => {
    const cfg = getPresetConfig('auth-registro');
    for (let i = 0; i < cfg.limit; i++) {
      await checkAuthRateLimits({
        ip: `5.5.5.${i}`,
        email: 'Admin@Empresa.CL',
        preset: 'auth-registro',
      });
    }
    const blocked = await checkAuthRateLimits({
      ip: '5.5.5.99',
      email: 'admin@empresa.cl',
      preset: 'auth-registro',
    });
    expect(blocked.success).toBe(false);
    expect(blocked.blockedBy).toBe('email');
  });

  it('sin email válido solo aplica IP', async () => {
    const r = await checkAuthRateLimits({
      ip: '10.20.30.40',
      email: 'not-valid',
      preset: 'auth-login',
    });
    expect(r.success).toBe(true);
    // Solo una dimensión → remaining = limit - 1
    expect(r.remaining).toBe(getPresetConfig('auth-login').limit - 1);
  });

  it('remaining es el mínimo de ambas dimensiones cuando ambas OK', async () => {
    // Pre-consumir 3 en email
    for (let i = 0; i < 3; i++) {
      await checkAuthRateLimits({
        ip: `7.7.7.${i}`,
        email: 'shared@test.cl',
        preset: 'auth-login',
      });
    }
    // Nueva IP, mismo email
    const r = await checkAuthRateLimits({
      ip: '7.7.7.200',
      email: 'shared@test.cl',
      preset: 'auth-login',
    });
    expect(r.success).toBe(true);
    // email ha consumido 4; IP ha consumido 1 → min remaining
    const cfg = getPresetConfig('auth-login');
    expect(r.remaining).toBe(cfg.limit - 4);
  });
});
