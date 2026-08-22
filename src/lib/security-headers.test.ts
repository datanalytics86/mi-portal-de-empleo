import { describe, it, expect } from 'vitest';
import {
  buildCsp,
  generateCspNonce,
  applySecurityHeaders,
  injectScriptNonces,
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

describe('buildCsp (Fase 2.1)', () => {
  it('incluye directivas base y no usa unsafe-eval', () => {
    const csp = buildCsp('n1', 'strict');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('https://unpkg.com');
    expect(csp).not.toContain('unsafe-eval');
  });

  it('modo strict con nonce: sin unsafe-inline en script-src', () => {
    const csp = buildCsp('abc123XYZ', 'strict');
    expect(csp).toContain("'nonce-abc123XYZ'");
    // style-src aún puede tener unsafe-inline; script-src no
    const scriptDir = csp.split('; ').find((d) => d.startsWith('script-src '));
    expect(scriptDir).toBeTruthy();
    expect(scriptDir).not.toContain("'unsafe-inline'");
    expect(csp).toContain("script-src-attr 'none'");
    // style-src mantiene unsafe-inline (documentado)
    expect(csp).toMatch(/style-src[^;]*'unsafe-inline'/);
  });

  it('modo legacy conserva unsafe-inline en script-src', () => {
    const csp = buildCsp('n', 'legacy');
    const scriptDir = csp.split('; ').find((d) => d.startsWith('script-src '));
    expect(scriptDir).toContain("'unsafe-inline'");
  });

  it('sin nonce cae a unsafe-inline en scripts (fallback seguro)', () => {
    const csp = buildCsp(undefined, 'strict');
    const scriptDir = csp.split('; ').find((d) => d.startsWith('script-src '));
    expect(scriptDir).toContain("'unsafe-inline'");
  });

  it('permite connect a Sentry y hosts de mapa/Supabase', () => {
    const csp = buildCsp('n', 'strict');
    expect(csp).toContain('fonts.googleapis.com');
    expect(csp).toContain('*.supabase.co');
    expect(csp).toContain('tile.openstreetmap.org');
    expect(csp).toContain('basemaps.cartocdn.com');
    expect(csp).toContain('sentry.io');
  });
});

describe('injectScriptNonces', () => {
  it('añade nonce a scripts sin atributo', () => {
    const html = '<html><script src="/a.js"></script><script>alert(1)</script></html>';
    const out = injectScriptNonces(html, 'xyz');
    expect(out).toContain('<script nonce="xyz" src="/a.js">');
    expect(out).toContain('<script nonce="xyz">alert(1)</script>');
  });

  it('no duplica nonce existente', () => {
    const html = '<script nonce="keep" src="x"></script>';
    expect(injectScriptNonces(html, 'new')).toBe(html);
  });

  it('preserva atributos del script', () => {
    const html = '<script type="module" defer src="/app.js"></script>';
    const out = injectScriptNonces(html, 'n1');
    expect(out).toContain('nonce="n1"');
    expect(out).toContain('type="module"');
    expect(out).toContain('defer');
  });
});

describe('applySecurityHeaders', () => {
  it('aplica headers de seguridad y CSP strict con nonce', () => {
    const res = new Response('ok', { status: 200 });
    applySecurityHeaders(res, { nonce: 'test-nonce', mode: 'strict' });
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    const csp = res.headers.get('Content-Security-Policy') || '';
    expect(csp).toContain("'nonce-test-nonce'");
    expect(csp.split('; ').find((d) => d.startsWith('script-src '))).not.toContain(
      "'unsafe-inline'",
    );
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
