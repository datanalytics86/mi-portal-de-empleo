export type Oferta = {
  id: string;
  titulo: string;
  empresa: string;
  tipoJornada: string;
  comuna: string;
  fecha: string;
  descripcion: string;
  lat: number;
  lng: number;
};

export const ofertas: Oferta[] = [
  {
    id: '1',
    titulo: 'Diseñador/a UX Junior',
    empresa: 'Andes Digital',
    tipoJornada: 'Full-time',
    comuna: 'Providencia',
    fecha: 'Hace 2 días',
    descripcion: 'Crea flujos simples y mejora la experiencia de usuarios en productos digitales.',
    lat: -33.4286,
    lng: -70.6207,
  },
  {
    id: '2',
    titulo: 'Analista de Operaciones',
    empresa: 'Logística Sur',
    tipoJornada: 'Part-time',
    comuna: 'Ñuñoa',
    fecha: 'Hace 4 días',
    descripcion: 'Optimiza procesos internos y coordina la operación diaria.',
    lat: -33.4569,
    lng: -70.5983,
  },
  {
    id: '3',
    titulo: 'Soporte TI',
    empresa: 'Nube Clara',
    tipoJornada: 'Freelance',
    comuna: 'Santiago Centro',
    fecha: 'Hace 1 semana',
    descripcion: 'Asiste a clientes y resuelve tickets con tiempos de respuesta cortos.',
    lat: -33.4489,
    lng: -70.6693,
  },
  {
    id: '4',
    titulo: 'Ejecutivo/a Comercial',
    empresa: 'Crecimiento LATAM',
    tipoJornada: 'Full-time',
    comuna: 'Las Condes',
    fecha: 'Hace 3 días',
    descripcion: 'Prospección y cierre de nuevas cuentas B2B.',
    lat: -33.4087,
    lng: -70.5672,
  },
];
