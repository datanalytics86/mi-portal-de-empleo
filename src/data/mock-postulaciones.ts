/**
 * Datos MOCK de Postulaciones
 *
 * Simula postulaciones de candidatos a ofertas de trabajo
 */

export interface MockPostulacion {
  id: string;
  oferta_id: string;
  nombre_candidato: string | null;
  email_candidato: string | null;
  cv_url: string; // URL simulada
  ip_address: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// POSTULACIONES MOCK
// ═══════════════════════════════════════════════════════════════════════════

export const mockPostulaciones: MockPostulacion[] = [
  // Oferta 1: Desarrollador Full Stack - 15 postulaciones
  {
    id: 'post-001',
    oferta_id: '1',
    nombre_candidato: 'Carlos Muñoz',
    email_candidato: 'carlos.munoz@email.com',
    cv_url: '1/carlos-munoz-cv.pdf',
    ip_address: '192.168.1.100',
    created_at: '2025-10-26T10:30:00Z'
  },
  {
    id: 'post-002',
    oferta_id: '1',
    nombre_candidato: 'María González',
    email_candidato: 'maria.gonzalez@email.com',
    cv_url: '1/maria-gonzalez-cv.pdf',
    ip_address: '192.168.1.101',
    created_at: '2025-10-26T14:20:00Z'
  },
  {
    id: 'post-003',
    oferta_id: '1',
    nombre_candidato: null,
    email_candidato: null,
    cv_url: '1/candidato-anonimo-1.pdf',
    ip_address: '192.168.1.102',
    created_at: '2025-10-27T09:15:00Z'
  },
  {
    id: 'post-004',
    oferta_id: '1',
    nombre_candidato: 'Pedro Sánchez',
    email_candidato: 'pedro.sanchez@email.com',
    cv_url: '1/pedro-sanchez-cv.pdf',
    ip_address: '192.168.1.103',
    created_at: '2025-10-27T16:45:00Z'
  },
  {
    id: 'post-005',
    oferta_id: '1',
    nombre_candidato: 'Ana Torres',
    email_candidato: 'ana.torres@email.com',
    cv_url: '1/ana-torres-cv.pdf',
    ip_address: '192.168.1.104',
    created_at: '2025-10-28T11:00:00Z'
  },

  // Oferta 2: Diseñador UX/UI - 8 postulaciones
  {
    id: 'post-006',
    oferta_id: '2',
    nombre_candidato: 'Sofía Ramírez',
    email_candidato: 'sofia.ramirez@email.com',
    cv_url: '2/sofia-ramirez-cv.pdf',
    ip_address: '192.168.1.105',
    created_at: '2025-10-26T13:30:00Z'
  },
  {
    id: 'post-007',
    oferta_id: '2',
    nombre_candidato: 'Diego Fernández',
    email_candidato: 'diego.fernandez@email.com',
    cv_url: '2/diego-fernandez-cv.pdf',
    ip_address: '192.168.1.106',
    created_at: '2025-10-27T10:00:00Z'
  },
  {
    id: 'post-008',
    oferta_id: '2',
    nombre_candidato: 'Valentina Rojas',
    email_candidato: 'valentina.rojas@email.com',
    cv_url: '2/valentina-rojas-cv.pdf',
    ip_address: '192.168.1.107',
    created_at: '2025-10-28T15:20:00Z'
  },

  // Oferta 3: Contador - 12 postulaciones
  {
    id: 'post-009',
    oferta_id: '3',
    nombre_candidato: 'Roberto Silva',
    email_candidato: 'roberto.silva@email.com',
    cv_url: '3/roberto-silva-cv.pdf',
    ip_address: '192.168.1.108',
    created_at: '2025-10-26T09:00:00Z'
  },
  {
    id: 'post-010',
    oferta_id: '3',
    nombre_candidato: 'Camila López',
    email_candidato: 'camila.lopez@email.com',
    cv_url: '3/camila-lopez-cv.pdf',
    ip_address: '192.168.1.109',
    created_at: '2025-10-27T12:30:00Z'
  },

  // Oferta 4: Ejecutivo de Ventas - 6 postulaciones
  {
    id: 'post-011',
    oferta_id: '4',
    nombre_candidato: 'Andrés Morales',
    email_candidato: 'andres.morales@email.com',
    cv_url: '4/andres-morales-cv.pdf',
    ip_address: '192.168.1.110',
    created_at: '2025-10-28T08:45:00Z'
  },
  {
    id: 'post-012',
    oferta_id: '4',
    nombre_candidato: 'Francisca Núñez',
    email_candidato: 'francisca.nunez@email.com',
    cv_url: '4/francisca-nunez-cv.pdf',
    ip_address: '192.168.1.111',
    created_at: '2025-10-28T14:00:00Z'
  },

  // Oferta 5: Ingeniero Civil - 5 postulaciones
  {
    id: 'post-013',
    oferta_id: '5',
    nombre_candidato: 'Luis Vargas',
    email_candidato: 'luis.vargas@email.com',
    cv_url: '5/luis-vargas-cv.pdf',
    ip_address: '192.168.1.112',
    created_at: '2025-10-27T11:30:00Z'
  },

  // Oferta 6: Marketing Digital - 10 postulaciones
  {
    id: 'post-014',
    oferta_id: '6',
    nombre_candidato: 'Daniela Castro',
    email_candidato: 'daniela.castro@email.com',
    cv_url: '6/daniela-castro-cv.pdf',
    ip_address: '192.168.1.113',
    created_at: '2025-10-26T16:00:00Z'
  },
  {
    id: 'post-015',
    oferta_id: '6',
    nombre_candidato: 'Matías Herrera',
    email_candidato: 'matias.herrera@email.com',
    cv_url: '6/matias-herrera-cv.pdf',
    ip_address: '192.168.1.114',
    created_at: '2025-10-27T13:45:00Z'
  },

  // Más postulaciones para otras ofertas (distribución realista)
  // Oferta 7, 8, 9, etc.
];

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtiene todas las postulaciones de una oferta
 */
export function getPostulacionesByOferta(ofertaId: string): MockPostulacion[] {
  return mockPostulaciones.filter(p => p.oferta_id === ofertaId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Obtiene una postulación por ID
 */
export function getPostulacionById(id: string): MockPostulacion | null {
  return mockPostulaciones.find(p => p.id === id) || null;
}

/**
 * Cuenta postulaciones por oferta
 */
export function countPostulacionesByOferta(ofertaId: string): number {
  return mockPostulaciones.filter(p => p.oferta_id === ofertaId).length;
}

/**
 * Obtiene estadísticas de postulaciones
 */
export function getPostulacionesStats(ofertaId: string) {
  const postulaciones = getPostulacionesByOferta(ofertaId);
  const conContacto = postulaciones.filter(p => p.email_candidato !== null);
  const sinContacto = postulaciones.filter(p => p.email_candidato === null);

  return {
    total: postulaciones.length,
    conContacto: conContacto.length,
    sinContacto: sinContacto.length,
    ultimaSemana: postulaciones.filter(p => {
      const date = new Date(p.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }).length
  };
}

/**
 * Genera URL de descarga simulada
 */
export function getDownloadUrl(postulacion: MockPostulacion): string {
  // En producción esto generaría una URL firmada de Supabase Storage
  return `/api/ofertas/${postulacion.oferta_id}/cv-download?file=${encodeURIComponent(postulacion.cv_url)}`;
}
