import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    tailwind({
      applyBaseStyles: false,
    })
  ],
  vite: {
    optimizeDeps: {
      exclude: ['leaflet']
    },
    ssr: {
      noExternal: ['leaflet']
    }
  },
  server: {
    port: 4321,
    host: true
  },
  build: {
    inlineStylesheets: 'auto'
  },
  security: {
    checkOrigin: true
  },
  // Headers de seguridad
  experimental: {
    middleware: true
  }
});
