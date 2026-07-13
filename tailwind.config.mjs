/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)',
        card: '0 1px 3px rgba(15, 23, 42, 0.05), 0 8px 24px -8px rgba(15, 23, 42, 0.08)',
        'card-hover':
          '0 4px 12px rgba(79, 70, 229, 0.08), 0 16px 40px -12px rgba(15, 23, 42, 0.12)',
        glow: '0 0 0 1px rgba(99, 102, 241, 0.12), 0 8px 32px -8px rgba(79, 70, 229, 0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      backgroundImage: {
        'hero-mesh':
          'radial-gradient(ellipse 80% 60% at 20% -10%, rgba(165, 180, 252, 0.35), transparent), radial-gradient(ellipse 60% 50% at 90% 10%, rgba(129, 140, 248, 0.25), transparent), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(99, 102, 241, 0.15), transparent)',
      },
      animation: {
        'fade-up': 'fadeUp 0.45s ease both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
