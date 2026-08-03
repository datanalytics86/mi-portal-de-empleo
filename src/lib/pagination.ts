/**
 * Utilidades mínimas de paginación server-side (Supabase range + UI links).
 */

export const DEFAULT_PAGE_SIZE = 20;
export const POSTULACIONES_PAGE_SIZE = 25;
export const DASHBOARD_PAGE_SIZE = 20;
/** Tope de marcadores en mapa (independiente de la página del listado). */
export const MAP_MARKERS_CAP = 200;

export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function parsePage(raw: string | null | undefined, fallback = 1): number {
  const n = Number.parseInt(raw || '', 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 10_000);
}

export function buildPageInfo(page: number, pageSize: number, total: number): PageInfo {
  const safeTotal = Math.max(0, total);
  const totalPages = Math.max(1, Math.ceil(safeTotal / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;
  return {
    page: safePage,
    pageSize,
    total: safeTotal,
    totalPages,
    from,
    to,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

/**
 * Construye URL relativa preservando search params y sobrescribiendo `page`.
 * Omite page=1 para URLs limpias.
 */
export function pageHref(
  pathname: string,
  searchParams: URLSearchParams,
  page: number,
): string {
  const p = new URLSearchParams(searchParams);
  if (page <= 1) p.delete('page');
  else p.set('page', String(page));
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
