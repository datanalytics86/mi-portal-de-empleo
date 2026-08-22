import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeSearchParam } from './html';

describe('escapeHtml', () => {
  it('entity-escapes angle brackets and quotes', () => {
    expect(escapeHtml('foo<bar"baz')).toBe('foo&lt;bar&quot;baz');
    expect(escapeHtml("a'b&c>d")).toBe('a&#39;b&amp;c&gt;d');
  });

  it('does not leave raw <script in the output', () => {
    const out = escapeHtml('x<script>y</script>');
    expect(out).not.toContain('<script');
    expect(out).toContain('&lt;script&gt;');
  });
});

describe('sanitizeSearchParam', () => {
  it('trunca y quita controles, conserva < para que escapeHtml lo vea', () => {
    expect(sanitizeSearchParam('ab<c', 10)).toBe('ab<c');
    expect(sanitizeSearchParam('a'.repeat(50), 8)).toBe('aaaaaaaa');
    expect(sanitizeSearchParam('a\u0000b')).toBe('ab');
    expect(sanitizeSearchParam(null)).toBe('');
  });
});
