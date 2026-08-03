import { describe, it, expect } from 'vitest';
import {
  buildPageInfo,
  parsePage,
  pageHref,
  POSTULACIONES_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
} from './pagination';

describe('parsePage', () => {
  it('defaults y sanitiza', () => {
    expect(parsePage(null)).toBe(1);
    expect(parsePage('')).toBe(1);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-3')).toBe(1);
    expect(parsePage('abc')).toBe(1);
    expect(parsePage('2')).toBe(2);
  });
});

describe('buildPageInfo', () => {
  it('calcula from/to y flags para postulaciones (page size 25)', () => {
    const info = buildPageInfo(2, POSTULACIONES_PAGE_SIZE, 60);
    expect(info.page).toBe(2);
    expect(info.totalPages).toBe(3);
    expect(info.from).toBe(25);
    expect(info.to).toBe(49);
    expect(info.hasPrev).toBe(true);
    expect(info.hasNext).toBe(true);
  });

  it('clampa página fuera de rango al totalPages', () => {
    const info = buildPageInfo(99, DEFAULT_PAGE_SIZE, 45);
    expect(info.totalPages).toBe(3);
    expect(info.page).toBe(3);
    expect(info.hasNext).toBe(false);
    expect(info.hasPrev).toBe(true);
  });

  it('total 0 → una página vacía lógica', () => {
    const info = buildPageInfo(1, 20, 0);
    expect(info.totalPages).toBe(1);
    expect(info.total).toBe(0);
    expect(info.hasPrev).toBe(false);
    expect(info.hasNext).toBe(false);
  });
});

describe('pageHref', () => {
  it('omite page=1 y preserva otros params', () => {
    const sp = new URLSearchParams('q=dev&tipo=full-time&page=3');
    expect(pageHref('/', sp, 1)).toBe('/?q=dev&tipo=full-time');
    expect(pageHref('/', sp, 2)).toBe('/?q=dev&tipo=full-time&page=2');
  });

  it('construye path de postulaciones', () => {
    const sp = new URLSearchParams();
    expect(pageHref('/empleador/oferta/abc/postulaciones', sp, 2)).toBe(
      '/empleador/oferta/abc/postulaciones?page=2',
    );
  });
});
