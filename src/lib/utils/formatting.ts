import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha como "hace X tiempo"
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
}

/**
 * Formatea una fecha en formato corto (ej: "24 Nov 2025")
 */
export function formatShortDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd MMM yyyy', { locale: es });
}

/**
 * Formatea una fecha en formato completo (ej: "24 de noviembre de 2025")
 */
export function formatLongDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * Retorna la distancia en kilómetros
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Redondear a 1 decimal
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formatea una distancia en kilómetros a texto legible
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Trunca un texto y agrega "..." si excede la longitud
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalize(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formatea un número de teléfono chileno
 * Ejemplo: +56912345678 -> +569 1234 5678
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('569') && cleaned.length === 11) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * Valida un RUT chileno
 */
export function validateRUT(rut: string): boolean {
  const cleaned = rut.replace(/[.-]/g, '');
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();

  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDV = 11 - (sum % 11);
  const calculatedDV =
    expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();

  return dv === calculatedDV;
}

/**
 * Formatea un RUT chileno
 * Ejemplo: 12345678-9 -> 12.345.678-9
 */
export function formatRUT(rut: string): string {
  const cleaned = rut.replace(/[.-]/g, '');
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
}
