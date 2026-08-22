import { describe, it, expect } from 'vitest';
import { foldSearch, matchesFolded, searchNeedles } from './search-fold';

describe('foldSearch', () => {
  it('pliega case y acentos', () => {
    expect(foldSearch('Enfermero')).toBe('enfermero');
    expect(foldSearch('Ñuñoa')).toBe('nunoa');
    expect(foldSearch('  O\'Higgins  ')).toBe('o higgins');
  });
});

describe('matchesFolded', () => {
  it('enfermera encuentra Enfermero/a', () => {
    const needles = searchNeedles('enfermera');
    expect(matchesFolded('Enfermero/a Clínico', needles)).toBe(true);
    expect(matchesFolded('Enfermero/a Clínico', searchNeedles('Enfermero'))).toBe(true);
    expect(matchesFolded('Enfermero/a Clínico', searchNeedles('ENFERMERO'))).toBe(true);
  });

  it('no matchea basura', () => {
    expect(matchesFolded('Desarrollador Frontend', searchNeedles('kinesiologo'))).toBe(false);
  });
});

describe('catálogo demo', async () => {
  const { filterDemoOfertas } = await import('./demo-catalog');
  it('q=enfermera y q=Enfermero devuelven el mismo set', () => {
    const a = filterDemoOfertas({ q: 'enfermera' }).map((o) => o.id).sort();
    const b = filterDemoOfertas({ q: 'Enfermero' }).map((o) => o.id).sort();
    expect(a.length).toBeGreaterThan(0);
    expect(a).toEqual(b);
  });
});
