import { describe, it, expect, afterEach } from 'vitest';
import { PRODUCTION_SITE_URL, isAllowedPostOrigin, resolvePublicOrigin } from './site-url';

const originalEnv = { ...import.meta.env };

afterEach(() => {
  for (const key of Object.keys(import.meta.env)) {
    delete (import.meta.env as Record<string, unknown>)[key];
  }
  Object.assign(import.meta.env, originalEnv);
});

describe('resolvePublicOrigin', () => {
  it('nunca devuelve localhost cuando hay host reenviado de producción', () => {
    const req = new Request('https://localhost/', {
      headers: {
        host: 'localhost',
        'x-forwarded-host': 'mi-portal-de-empleo.vercel.app',
        'x-forwarded-proto': 'https',
      },
    });
    const origin = resolvePublicOrigin({
      requestUrl: new URL('https://localhost/'),
      request: req,
    });
    expect(origin).toBe('https://mi-portal-de-empleo.vercel.app');
    expect(origin).not.toContain('localhost');
  });

  it('usa PUBLIC_SITE_URL si no es localhost', () => {
    (import.meta.env as Record<string, string>).PUBLIC_SITE_URL =
      'https://mi-portal-de-empleo.vercel.app';
    expect(resolvePublicOrigin({ requestUrl: new URL('https://localhost/') })).toBe(
      'https://mi-portal-de-empleo.vercel.app',
    );
  });

  it('en producción sin host útil cae al dominio canónico', () => {
    (import.meta.env as Record<string, string>).VERCEL_ENV = 'production';
    const origin = resolvePublicOrigin({ requestUrl: new URL('https://localhost/sitemap.xml') });
    expect(origin).toBe(PRODUCTION_SITE_URL);
  });
});

describe('isAllowedPostOrigin', () => {
  it('acepta el origen público y localhost (dev)', () => {
    expect(isAllowedPostOrigin('https://mi-portal-de-empleo.vercel.app')).toBe(true);
    expect(isAllowedPostOrigin('http://localhost:4321')).toBe(true);
  });

  it('rechaza un origen cruzado arbitrario', () => {
    expect(isAllowedPostOrigin('https://evil.example')).toBe(false);
  });
});
