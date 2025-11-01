/**
 * Asociación MOCK entre empleadores y ofertas
 *
 * Define qué ofertas pertenecen a qué empleador
 */

import { mockOfertas } from './mock-ofertas';
import type { MockOferta } from './mock-ofertas';

// ═══════════════════════════════════════════════════════════════════════════
// MAPEO EMPLEADOR → OFERTAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mapeo de empleador_id a IDs de ofertas
 */
export const empleadorOfertasMap: Record<string, string[]> = {
  'emp-001': ['1', '2', '3', '4', '5'], // TechCorp Chile (demo@empresa.cl)
  'emp-002': ['6', '7', '8', '9'],     // Acme Corporation (rrhh@acme.cl)
  'emp-003': ['10', '11', '12'],       // Startup Innovadora (empleos@startup.cl)
};

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtiene todas las ofertas de un empleador
 */
export function getOfertasByEmpleador(empleadorId: string): MockOferta[] {
  const ofertaIds = empleadorOfertasMap[empleadorId] || [];
  return mockOfertas.filter(o => ofertaIds.includes(o.id));
}

/**
 * Obtiene el empleador dueño de una oferta
 */
export function getEmpleadorIdByOferta(ofertaId: string): string | null {
  for (const [empleadorId, ofertaIds] of Object.entries(empleadorOfertasMap)) {
    if (ofertaIds.includes(ofertaId)) {
      return empleadorId;
    }
  }
  return null;
}

/**
 * Verifica si un empleador es dueño de una oferta
 */
export function empleadorOwnsOferta(empleadorId: string, ofertaId: string): boolean {
  const ofertaIds = empleadorOfertasMap[empleadorId] || [];
  return ofertaIds.includes(ofertaId);
}

/**
 * Agrega una nueva oferta a un empleador (en memoria)
 */
export function assignOfertaToEmpleador(empleadorId: string, ofertaId: string) {
  if (!empleadorOfertasMap[empleadorId]) {
    empleadorOfertasMap[empleadorId] = [];
  }
  if (!empleadorOfertasMap[empleadorId].includes(ofertaId)) {
    empleadorOfertasMap[empleadorId].push(ofertaId);
  }
}

/**
 * Obtiene estadísticas del empleador
 */
export function getEmpleadorStats(empleadorId: string) {
  const ofertas = getOfertasByEmpleador(empleadorId);
  const activas = ofertas.filter(o => o.activa && new Date(o.expires_at) >= new Date());
  const totalPostulaciones = ofertas.reduce((sum, o) => sum + o.postulaciones_count, 0);

  return {
    totalOfertas: ofertas.length,
    ofertasActivas: activas.length,
    totalPostulaciones
  };
}
