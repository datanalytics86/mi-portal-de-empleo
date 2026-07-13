/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  /** xAI / SpaceXAI — parsing estructurado con Grok (opcional) */
  readonly XAI_API_KEY?: string;
  /** Modelo económico por defecto: grok-3-mini */
  readonly XAI_MODEL?: string;
  /** URL de la Edge Function parse-cv (opcional, reintentos) */
  readonly SUPABASE_EDGE_PARSE_CV_URL?: string;
  /** OCR PDFs escaneados (default: true) */
  readonly CV_OCR_ENABLED?: string;
  /** Máx. páginas a OCR (default: 3) */
  readonly CV_OCR_MAX_PAGES?: string;
  /** Timeout OCR ms (default: 50000) */
  readonly CV_OCR_TIMEOUT_MS?: string;
  /** OCR.space API key — cloud preferido en Vercel https://ocr.space/ocrapi */
  readonly OCR_SPACE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    session?: import('./lib/auth').EmpleadorSession;
  }
}
