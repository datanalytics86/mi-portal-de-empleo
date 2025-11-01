/// <reference types="astro/client" />

/**
 * Extensiones del tipo Window para el sistema de notificaciones Toast
 */
interface Window {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}
