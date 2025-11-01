/**
 * Sistema de Autenticación MOCK
 *
 * Simula autenticación de empleadores sin backend real
 * Perfecto para demo y testing
 */

import type { AstroCookies } from 'astro';

// ═══════════════════════════════════════════════════════════════════════════
// DATOS MOCK - Usuarios de prueba
// ═══════════════════════════════════════════════════════════════════════════

export interface MockUser {
  id: string;
  email: string;
  password: string; // En producción NUNCA guardar contraseñas en texto plano
  nombre_empresa: string;
  created_at: string;
}

export const mockUsers: MockUser[] = [
  {
    id: 'emp-001',
    email: 'demo@empresa.cl',
    password: 'demo123',
    nombre_empresa: 'TechCorp Chile',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'emp-002',
    email: 'rrhh@acme.cl',
    password: 'acme123',
    nombre_empresa: 'Acme Corporation',
    created_at: '2025-01-15T00:00:00Z'
  },
  {
    id: 'emp-003',
    email: 'empleos@startup.cl',
    password: 'startup123',
    nombre_empresa: 'Startup Innovadora',
    created_at: '2025-02-01T00:00:00Z'
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE AUTENTICACIÓN MOCK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Intenta hacer login con email y password
 */
export function mockLogin(email: string, password: string): MockUser | null {
  const user = mockUsers.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  return user || null;
}

/**
 * Registra un nuevo usuario (mock - solo lo agrega al array en memoria)
 */
export function mockRegister(email: string, password: string, nombreEmpresa: string): MockUser {
  // Verificar si ya existe
  const exists = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw new Error('El email ya está registrado');
  }

  const newUser: MockUser = {
    id: `emp-${Date.now()}`,
    email: email.toLowerCase(),
    password, // En producción hashear
    nombre_empresa: nombreEmpresa,
    created_at: new Date().toISOString()
  };

  mockUsers.push(newUser);
  return newUser;
}

/**
 * Busca usuario por ID
 */
export function findUserById(id: string): MockUser | null {
  return mockUsers.find(u => u.id === id) || null;
}

/**
 * Busca usuario por email
 */
export function findUserByEmail(email: string): MockUser | null {
  return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// GESTIÓN DE SESIONES CON COOKIES
// ═══════════════════════════════════════════════════════════════════════════

const SESSION_COOKIE_NAME = 'mock-session';
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7 días en segundos

/**
 * Crea un token de sesión simple (no es seguro para producción)
 */
function createSessionToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + (SESSION_EXPIRY * 1000)
  };
  return btoa(JSON.stringify(payload)); // Base64 encode
}

/**
 * Decodifica un token de sesión
 */
function decodeSessionToken(token: string): { userId: string; exp: number } | null {
  try {
    const decoded = JSON.parse(atob(token));

    // Verificar si expiró
    if (decoded.exp < Date.now()) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Establece cookie de sesión
 */
export function setMockSession(cookies: AstroCookies, userId: string) {
  const token = createSessionToken(userId);

  cookies.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    maxAge: SESSION_EXPIRY,
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
  });
}

/**
 * Obtiene la sesión actual desde cookies
 */
export function getMockSession(cookies: AstroCookies): MockUser | null {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const decoded = decodeSessionToken(token);
  if (!decoded) {
    return null;
  }

  return findUserById(decoded.userId);
}

/**
 * Verifica si hay sesión activa
 */
export function isMockAuthenticated(cookies: AstroCookies): boolean {
  return getMockSession(cookies) !== null;
}

/**
 * Cierra sesión (elimina cookie)
 */
export function clearMockSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDACIONES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida contraseña
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  return { valid: true };
}

/**
 * Tipo para el perfil del empleador (compatible con la interfaz existente)
 */
export interface EmpleadorProfile {
  id: string;
  email: string;
  nombre_empresa: string;
  created_at: string;
}

/**
 * Obtiene el perfil del empleador actual
 */
export function getMockEmpleadorProfile(cookies: AstroCookies): EmpleadorProfile | null {
  const user = getMockSession(cookies);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    nombre_empresa: user.nombre_empresa,
    created_at: user.created_at
  };
}
