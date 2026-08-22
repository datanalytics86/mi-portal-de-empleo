import { describe, it, expect } from 'vitest';
import { recommendOfertas } from './recommend';
import { getDemoOfertas, type PublicOferta } from './demo-catalog';

const sample: PublicOferta[] = [
  {
    id: 'eeeeeeee-0000-4000-8000-000000000001',
    titulo: 'Desarrollador/a Frontend React',
    descripcion: 'Buscamos React TypeScript Next.js en Santiago.',
    empresa: 'Andes Digital SpA',
    tipo_empleo: 'full-time',
    categoria: 'Tecnología',
    comuna: 'Santiago',
    lat: -33.45,
    lng: -70.66,
    activa: true,
    expira_en: new Date(Date.now() + 86400000 * 30).toISOString(),
    empleador_id: 'eeeeeeee-0000-4000-8000-000000000000',
    created_at: new Date().toISOString(),
  },
  {
    id: 'eeeeeeee-0000-4000-8000-000000000002',
    titulo: 'Enfermero/a Clínico',
    descripcion: 'Turnos en UCI. Experiencia en enfermería.',
    empresa: 'Cordillera Salud',
    tipo_empleo: 'full-time',
    categoria: 'Salud',
    comuna: 'Providencia',
    lat: -33.43,
    lng: -70.61,
    activa: true,
    expira_en: new Date(Date.now() + 86400000 * 30).toISOString(),
    empleador_id: 'eeeeeeee-0000-4000-8000-000000000000',
    created_at: new Date().toISOString(),
  },
  {
    id: 'eeeeeeee-0000-4000-8000-000000000003',
    titulo: 'Ejecutivo/a de Ventas',
    descripcion: 'Retail B2B. Negociación y CRM.',
    empresa: 'Pacífico Retail',
    tipo_empleo: 'full-time',
    categoria: 'Ventas',
    comuna: 'Las Condes',
    lat: -33.41,
    lng: -70.57,
    activa: true,
    expira_en: new Date(Date.now() + 86400000 * 30).toISOString(),
    empleador_id: 'eeeeeeee-0000-4000-8000-000000000000',
    created_at: new Date().toISOString(),
  },
  {
    id: 'eeeeeeee-0000-4000-8000-000000000004',
    titulo: 'Analista Contable',
    descripcion: 'IFRS, SII e IVA. Softland.',
    empresa: 'Finanzas Andinas',
    tipo_empleo: 'full-time',
    categoria: 'Finanzas',
    comuna: 'Santiago',
    lat: -33.45,
    lng: -70.66,
    activa: true,
    expira_en: new Date(Date.now() + 86400000 * 30).toISOString(),
    empleador_id: 'eeeeeeee-0000-4000-8000-000000000000',
    created_at: new Date().toISOString(),
  },
];

describe('recommendOfertas', () => {
  it('prioriza ofertas cuyo texto solapa keywords del CV', () => {
    const recs = recommendOfertas({
      keywords: ['React', 'TypeScript', 'Frontend'],
      ofertas: sample,
      limit: 3,
    });
    expect(recs.length).toBeGreaterThanOrEqual(3);
    expect(recs.length).toBeLessThanOrEqual(6);
    expect(recs[0]!.id).toBe('eeeeeeee-0000-4000-8000-000000000001');
    expect(recs[0]!.match_score).toBeGreaterThan(recs[1]!.match_score);
    expect(recs[0]!.match_score).toBeGreaterThanOrEqual(40);
    expect(recs[0]!.match_score).toBeLessThanOrEqual(100);
  });

  it('sin keywords devuelve recorte diverso, no vacío', () => {
    const recs = recommendOfertas({ keywords: [], ofertas: sample, limit: 3 });
    expect(recs).toHaveLength(3);
    const cats = new Set(recs.map((r) => r.categoria));
    expect(cats.size).toBeGreaterThanOrEqual(3);
    expect(recs.every((r) => r.match_score === 0)).toBe(true);
  });

  it('respeta el límite y aplica bonus de categoría', () => {
    const recs = recommendOfertas({
      keywords: ['enfermería'],
      categoria: 'Salud',
      ofertas: sample,
      limit: 3,
    });
    expect(recs[0]!.categoria).toBe('Salud');
    expect(recs).toHaveLength(3);
  });

  it('funciona contra el catálogo demo completo', () => {
    const recs = recommendOfertas({
      keywords: ['React', 'TypeScript', 'Node'],
      ofertas: getDemoOfertas(),
      limit: 6,
    });
    expect(recs).toHaveLength(6);
    expect(recs[0]!.match_score).toBeGreaterThan(0);
    expect(new Set(recs.map((r) => r.id)).size).toBe(6);
  });
});
