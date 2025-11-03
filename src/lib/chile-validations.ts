/**
 * Utilidades para validación de datos chilenos
 *
 * Incluye validación de:
 * - RUT (Rol Único Tributario)
 * - Teléfonos chilenos
 * - Formateo de datos
 */

// ═══════════════════════════════════════════════════════════════════════════
// VALIDACIÓN DE RUT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Limpia un RUT removiendo puntos y guiones
 * @param rut - RUT con o sin formato
 * @returns RUT limpio (solo números y K)
 *
 * @example
 * cleanRut('12.345.678-9') // '123456789'
 * cleanRut('12345678-K') // '12345678K'
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[.\-]/g, '').toUpperCase();
}

/**
 * Formatea un RUT con puntos y guión
 * @param rut - RUT sin formato
 * @returns RUT formateado
 *
 * @example
 * formatRut('123456789') // '12.345.678-9'
 * formatRut('12345678K') // '12.345.678-K'
 */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);

  if (cleaned.length < 2) {
    return cleaned;
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // Agregar puntos cada 3 dígitos desde la derecha
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${dv}`;
}

/**
 * Calcula el dígito verificador de un RUT
 * @param rut - Número de RUT sin dígito verificador
 * @returns Dígito verificador (0-9 o 'K')
 */
export function calculateDV(rut: string): string {
  const cleanedRut = rut.replace(/[^0-9]/g, '');

  let suma = 0;
  let multiplicador = 2;

  // Recorrer de derecha a izquierda
  for (let i = cleanedRut.length - 1; i >= 0; i--) {
    suma += parseInt(cleanedRut[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  const dv = 11 - resto;

  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

/**
 * Valida un RUT chileno
 * @param rut - RUT a validar (con o sin formato)
 * @returns true si el RUT es válido
 *
 * @example
 * validateRut('12.345.678-9') // false (DV incorrecto)
 * validateRut('11.111.111-1') // true
 * validateRut('12345678-5') // true
 */
export function validateRut(rut: string): boolean {
  if (!rut || rut.trim() === '') {
    return false;
  }

  const cleaned = cleanRut(rut);

  // Validar formato: debe tener entre 8 y 9 caracteres (RUT + DV)
  if (cleaned.length < 8 || cleaned.length > 9) {
    return false;
  }

  // Validar que sea solo números y K
  if (!/^[0-9]+[0-9K]$/.test(cleaned)) {
    return false;
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  const calculatedDV = calculateDV(body);

  return dv === calculatedDV;
}

/**
 * Valida y retorna mensaje de error para RUT
 * @param rut - RUT a validar
 * @returns null si es válido, string con error si no
 */
export function validateRutWithMessage(rut: string): string | null {
  if (!rut || rut.trim() === '') {
    return 'El RUT es requerido';
  }

  const cleaned = cleanRut(rut);

  if (cleaned.length < 8) {
    return 'El RUT es demasiado corto';
  }

  if (cleaned.length > 9) {
    return 'El RUT es demasiado largo';
  }

  if (!/^[0-9]+[0-9K]$/.test(cleaned)) {
    return 'El RUT solo debe contener números y opcionalmente K';
  }

  if (!validateRut(rut)) {
    return 'El RUT no es válido (dígito verificador incorrecto)';
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDACIÓN DE TELÉFONOS CHILENOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Limpia un teléfono removiendo espacios, guiones y paréntesis
 * @param phone - Teléfono con o sin formato
 * @returns Teléfono limpio
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

/**
 * Formatea un teléfono chileno
 * @param phone - Teléfono sin formato
 * @returns Teléfono formateado
 *
 * @example
 * formatPhone('56912345678') // '+56 9 1234 5678'
 * formatPhone('912345678') // '+56 9 1234 5678'
 * formatPhone('221234567') // '+56 22 123 4567' (fijo Santiago)
 */
export function formatPhone(phone: string): string {
  const cleaned = cleanPhone(phone);

  // Remover +56 si existe
  const withoutPrefix = cleaned.replace(/^\+?56/, '');

  // Celular (9 dígitos empezando con 9)
  if (withoutPrefix.length === 9 && withoutPrefix.startsWith('9')) {
    return `+56 9 ${withoutPrefix.substring(1, 5)} ${withoutPrefix.substring(5)}`;
  }

  // Fijo (7-9 dígitos)
  if (withoutPrefix.length >= 7 && withoutPrefix.length <= 9) {
    const areaCode = withoutPrefix.substring(0, withoutPrefix.length - 7);
    const number = withoutPrefix.substring(withoutPrefix.length - 7);

    if (areaCode) {
      return `+56 ${areaCode} ${number.substring(0, 3)} ${number.substring(3)}`;
    }
    return `+56 ${number.substring(0, 3)} ${number.substring(3)}`;
  }

  return `+56 ${withoutPrefix}`;
}

/**
 * Valida un teléfono chileno
 * @param phone - Teléfono a validar
 * @returns true si el teléfono es válido
 *
 * Formatos válidos:
 * - Celular: 9 1234 5678 o +56 9 1234 5678
 * - Fijo Santiago: 2 1234 5678 o +56 2 1234 5678
 * - Fijo regiones: 32 123 4567 (Valparaíso), etc.
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === '') {
    return false;
  }

  const cleaned = cleanPhone(phone);

  // Remover +56 si existe
  const withoutPrefix = cleaned.replace(/^\+?56/, '');

  // Validar que sean solo números
  if (!/^\d+$/.test(withoutPrefix)) {
    return false;
  }

  // Celular: 9 dígitos empezando con 9
  if (withoutPrefix.length === 9 && withoutPrefix.startsWith('9')) {
    return true;
  }

  // Fijo: 7-9 dígitos (2 Santiago, 32 Valparaíso, 41 Concepción, etc.)
  if (withoutPrefix.length >= 7 && withoutPrefix.length <= 9) {
    return true;
  }

  return false;
}

/**
 * Valida y retorna mensaje de error para teléfono
 * @param phone - Teléfono a validar
 * @returns null si es válido, string con error si no
 */
export function validatePhoneWithMessage(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return 'El teléfono es requerido';
  }

  const cleaned = cleanPhone(phone);
  const withoutPrefix = cleaned.replace(/^\+?56/, '');

  if (!/^\d+$/.test(withoutPrefix)) {
    return 'El teléfono solo debe contener números';
  }

  if (withoutPrefix.length < 7) {
    return 'El teléfono es demasiado corto';
  }

  if (withoutPrefix.length > 9) {
    return 'El teléfono es demasiado largo';
  }

  if (!validatePhone(phone)) {
    return 'El teléfono no tiene un formato válido';
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Niveles de estudios disponibles en Chile
 */
export const NIVELES_ESTUDIO = [
  'Educación Básica',
  'Educación Media',
  'Técnico Nivel Medio',
  'Técnico Nivel Superior',
  'Universitaria Incompleta',
  'Universitaria Completa',
  'Postgrado/Magíster',
  'Doctorado'
] as const;

export type NivelEstudio = typeof NIVELES_ESTUDIO[number];

/**
 * Opciones de disponibilidad
 */
export const DISPONIBILIDADES = [
  'Inmediata',
  '1 semana',
  '2 semanas',
  '1 mes',
  '2 meses',
  '3 meses o más'
] as const;

export type Disponibilidad = typeof DISPONIBILIDADES[number];

/**
 * Rangos de salario esperado (en pesos chilenos)
 */
export const RANGOS_SALARIO = [
  'Menos de $500.000',
  '$500.000 - $800.000',
  '$800.000 - $1.200.000',
  '$1.200.000 - $1.800.000',
  '$1.800.000 - $2.500.000',
  '$2.500.000 - $3.500.000',
  '$3.500.000 - $5.000.000',
  'Más de $5.000.000',
  'A convenir'
] as const;

export type RangoSalario = typeof RANGOS_SALARIO[number];

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valida una URL (LinkedIn, portfolio, etc.)
 * @param url - URL a validar
 * @returns true si es válida
 */
export function validateURL(url: string): boolean {
  if (!url || url.trim() === '') {
    return true; // URLs opcionales
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Valida URL de LinkedIn
 * @param url - URL a validar
 * @returns true si es LinkedIn válido
 */
export function validateLinkedInURL(url: string): boolean {
  if (!url || url.trim() === '') {
    return true; // Opcional
  }

  if (!validateURL(url)) {
    return false;
  }

  return url.includes('linkedin.com/in/');
}

/**
 * Formatea número con separador de miles
 * @param num - Número a formatear
 * @returns Número formateado
 *
 * @example
 * formatNumber(1234567) // '1.234.567'
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
