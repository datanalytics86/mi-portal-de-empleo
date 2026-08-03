import { describe, it, expect } from 'vitest';
import { computeMatchScore, matchScoreTone } from './match-score';
import { emptyCvParsed } from './types';

describe('computeMatchScore', () => {
  it('devuelve null si no hay texto de oferta', () => {
    const cv = emptyCvParsed({ skills_tecnicas: ['React', 'TypeScript'] });
    expect(computeMatchScore(cv, null)).toBeNull();
    expect(computeMatchScore(cv, '')).toBeNull();
    expect(computeMatchScore(cv, '   ')).toBeNull();
  });

  it('devuelve null si la oferta es demasiado corta', () => {
    const cv = emptyCvParsed({ skills_tecnicas: ['React'] });
    expect(computeMatchScore(cv, 'corto')).toBeNull();
  });

  it('devuelve 0 si el CV no tiene términos', () => {
    const cv = emptyCvParsed();
    const score = computeMatchScore(
      cv,
      'Buscamos desarrollador React con experiencia en TypeScript y Node.js para equipo en Santiago.',
    );
    expect(score).toBe(0);
  });

  it('puntúa alto cuando skills del CV coinciden con la oferta', () => {
    const cv = emptyCvParsed({
      skills_tecnicas: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      keywords: ['frontend', 'fullstack'],
      titulo_profesional: 'Desarrollador Frontend',
      anos_experiencia: 5,
    });
    const oferta =
      'Buscamos Desarrollador Frontend con React, TypeScript y Node.js. ' +
      'Experiencia con PostgreSQL y 3+ años en equipos ágiles. Fullstack bienvenido.';
    const score = computeMatchScore(cv, oferta);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThanOrEqual(40);
    expect(score!).toBeLessThanOrEqual(100);
  });

  it('puntúa bajo cuando no hay solapamiento', () => {
    const cv = emptyCvParsed({
      skills_tecnicas: ['Enfermería', 'UCI', 'Farmacia'],
      keywords: ['salud', 'hospital'],
    });
    const oferta =
      'Se busca contador con experiencia en IFRS, Softland y facturación electrónica SII Chile.';
    const score = computeMatchScore(cv, oferta);
    expect(score).not.toBeNull();
    expect(score!).toBeLessThan(40);
  });

  it('aplica bonus de años de experiencia cuando se cumple el requisito', () => {
    const base = emptyCvParsed({
      skills_tecnicas: ['Python', 'Django'],
      keywords: ['backend'],
      anos_experiencia: 5,
    });
    const oferta =
      'Backend engineer Python Django. Se requieren 4 años de experiencia en APIs REST y bases de datos.';
    const withYears = computeMatchScore(base, oferta);
    const withoutYears = computeMatchScore(
      emptyCvParsed({ ...base, anos_experiencia: null }),
      oferta,
    );
    expect(withYears).not.toBeNull();
    expect(withoutYears).not.toBeNull();
    expect(withYears!).toBeGreaterThanOrEqual(withoutYears!);
  });

  it('clampa el score entre 0 y 100', () => {
    const cv = emptyCvParsed({
      skills_tecnicas: [
        'React',
        'TypeScript',
        'JavaScript',
        'Node.js',
        'PostgreSQL',
        'Docker',
        'Kubernetes',
        'AWS',
      ],
      skills_blandas: ['Liderazgo', 'Comunicación'],
      keywords: ['arquitectura', 'microservicios', 'ci/cd'],
      titulo_profesional: 'Senior Fullstack Engineer',
      experiencia: [{ empresa: 'X', cargo: 'Tech Lead', fecha_inicio: null, fecha_fin: null, descripcion: null }],
      anos_experiencia: 10,
    });
    const oferta =
      'Senior Fullstack Engineer React TypeScript JavaScript Node.js PostgreSQL Docker Kubernetes AWS ' +
      'arquitectura microservicios CI/CD liderazgo comunicación tech lead 8 años de experiencia.';
    const score = computeMatchScore(cv, oferta);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThanOrEqual(0);
    expect(score!).toBeLessThanOrEqual(100);
  });
});

describe('matchScoreTone', () => {
  it('clasifica tonos por umbral', () => {
    expect(matchScoreTone(null)).toBe('none');
    expect(matchScoreTone(80)).toBe('high');
    expect(matchScoreTone(70)).toBe('high');
    expect(matchScoreTone(55)).toBe('mid');
    expect(matchScoreTone(40)).toBe('mid');
    expect(matchScoreTone(10)).toBe('low');
  });
});
