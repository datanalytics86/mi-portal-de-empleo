import { defineConfig } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme.js';

export default defineConfig({
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#dce7ff',
          500: '#2d5bff',
          600: '#1b4ee5',
          700: '#163fbf',
        },
      },
      boxShadow: {
        soft: '0 10px 40px rgba(45, 91, 255, 0.1)',
      },
    },
  },
  plugins: [],
});
