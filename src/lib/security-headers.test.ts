import { describe, it, expect } from 'vitest';
import {
  buildCsp,
  generateCspNonce,
  applySecurityHeaders,
  SECURITY_HEADERS,
} from './security-headers';

describe('generateCspNonce', () => {
  it('genera nonces distintos y no vacíos', () => {
    const a = generateCspNonce();
    const b = generateCspNonce();
    expect(a.length).toBeGreaterThan(8);
    expect(b.length).toBeGreaterThan(8);
    expect(a).not.toBe(b);
  });
});

describe('buildCsp', () => {
  it('incluye directivas base y no usa unsafe-eval', () => {
    const csp = buildCsp();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('https://unpkg.com');
    expect(csp).not.toContain('unsafe-eval');
  });

  it('incluye nonce cuando se pasa', () => {
    const csp = buildCsp('abc123XYZ');
    expect(csp).toContain("'nonce-abc123XYZ'");
    // Fase 2: unsafe-inline aún presente (Astro VT / scripts de página)
    expect(csp).toContain("'unsafe-inline'");
  });

  it('documenta hosts de Leaflet/Fonts/Supabase', () => {
    const csp = buildCsp('n');
    expect(csp).toContain('fonts.googleapis.com');
    expect(csp).toContain('fonts.gstatic.com');
    expect(csp).toContain('*.supabase.co');
    expect(csp).toContain('tile.openstreetmap.org');
  });
});

describe('applySecurityHeaders', () => {
  it('aplica headers de seguridad y CSP con nonce', () => {
    const res = new Response('ok', { status: 200 });
    applySecurityHeaders(res, { nonce: 'test-nonce' });
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Content-Security-Policy')).toContain("'nonce-test-nonce'");
    expect(res.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    for (const key of Object.keys(SECURITY_HEADERS)) {
      expect(res.headers.get(key)).toBeTruthy();
    }
  });

  it('no sobrescribe CSP preexistente', () => {
    const res = new Response('ok', {
      headers: { 'Content-Security-Policy': "default-src 'none'" },
    });
    applySecurityHeaders(res, { nonce: 'x' });
    expect(res.headers.get('Content-Security-Policy')).toBe("default-src 'none'");
  });
});
