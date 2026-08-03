import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log } from './logger';

describe('log estructurado', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emite JSON con event y level', () => {
    log.info('parse_cv.complete', { status: 'success', duration_ms: 12 });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const line = String(infoSpy.mock.calls[0]![0]);
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe('info');
    expect(parsed.event).toBe('parse_cv.complete');
    expect(parsed.status).toBe('success');
    expect(parsed.duration_ms).toBe(12);
    expect(parsed.ts).toBeTruthy();
  });

  it('redacta emails parcialmente', () => {
    log.error('auth.login_failed', { email: 'juan.perez@empresa.cl' });
    const line = String(errorSpy.mock.calls[0]![0]);
    const parsed = JSON.parse(line);
    expect(parsed.email).toMatch(/^ju\*\*\*@empresa\.cl$/);
    expect(line).not.toContain('juan.perez@');
  });
});
