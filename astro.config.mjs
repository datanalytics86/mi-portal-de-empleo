import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

const site =
  (process.env.PUBLIC_SITE_URL || 'https://mi-portal-de-empleo.vercel.app').replace(
    /\/+$/,
    '',
  );

export default defineConfig({
  site,
  output: 'server',
  // Astro.checkOrigin compara Origin vs request URL. En Vercel el request
  // origin es https://localhost → 403 "Cross-site POST form submissions are forbidden".
  // El middleware aplica un allowlist contra el origen público.
  security: {
    checkOrigin: false,
  },
  adapter: vercel({
    // OCR (tesseract + render PDF) puede superar el default 10s en Hobby
    maxDuration: 60,
  }),
  integrations: [tailwind()],
  vite: {
    // Evitar que Vite intente pre-bundlear binarios nativos / workers de OCR
    optimizeDeps: {
      exclude: ['@napi-rs/canvas', 'tesseract.js', 'pdfjs-dist'],
    },
    ssr: {
      external: ['@napi-rs/canvas', 'tesseract.js', 'pdfjs-dist', 'pdf-parse', 'mammoth', 'postgres'],
    },
  },
});
