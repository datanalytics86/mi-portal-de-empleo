import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
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
      external: ['@napi-rs/canvas', 'tesseract.js', 'pdfjs-dist', 'pdf-parse', 'mammoth'],
    },
  },
});
