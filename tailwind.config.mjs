import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', ...defaultTheme.fontFamily.sans],
        display: ['"Sora"', ...defaultTheme.fontFamily.sans]
      },
      colors: {
        primary: {
          50: '#f3f6ff',
          100: '#e0e9ff',
          200: '#bbd1ff',
          300: '#94b6ff',
          400: '#6d97ff',
          500: '#4b7bff',
          600: '#2e5fe3',
          700: '#2149b6',
          800: '#1a3b8f',
          900: '#152d69'
        },
        secondary: {
          50: '#edfcff',
          100: '#d5f5ff',
          200: '#a9e9ff',
          300: '#6fd9ff',
          400: '#31c6ff',
          500: '#00aae6',
          600: '#0086bf',
          700: '#006994',
          800: '#024e6d',
          900: '#02354a'
        },
        accent: {
          50: '#fdf5ff',
          100: '#f8e8ff',
          200: '#efc9ff',
          300: '#df9eff',
          400: '#c76bff',
          500: '#a53fff',
          600: '#8726e6',
          700: '#6b1eb6',
          800: '#51198a',
          900: '#381161'
        }
      },
      boxShadow: {
        glow: '0 30px 80px -40px rgba(37, 95, 227, 0.55)',
        outline: '0 0 0 1px rgba(15, 23, 42, 0.05)',
        deluxe: '0 40px 120px -50px rgba(14, 23, 53, 0.65)',
        innerGlow: 'inset 0 1px 0 rgba(255,255,255,0.65)'
      },
      dropShadow: {
        aurora: ['0 25px 55px rgba(79, 143, 255, 0.3)', '0 35px 60px rgba(167, 119, 255, 0.18)']
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(120% 120% at 80% 10%, rgba(49, 198, 255, 0.28) 0%, rgba(0, 170, 230, 0) 60%), radial-gradient(90% 90% at 0% 0%, rgba(75, 123, 255, 0.26) 0%, rgba(75, 123, 255, 0) 60%)',
        'aurora-gradient':
          'conic-gradient(from 180deg at 40% 20%, rgba(75, 123, 255, 0.5), rgba(0, 170, 230, 0.6), rgba(165, 63, 255, 0.45), rgba(75, 123, 255, 0.5))',
        'soft-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.7) 50%, rgba(226,232,255,0.65) 100%)',
        'mesh-light':
          'radial-gradient(60% 80% at 20% 20%, rgba(75,123,255,0.16), transparent 70%), radial-gradient(50% 90% at 85% 25%, rgba(0,170,230,0.18), transparent 70%), radial-gradient(50% 60% at 50% 75%, rgba(165,63,255,0.12), transparent 70%)'
      },
      blur: {
        xs: '2px'
      },
      animation: {
        'pulse-soft': 'pulse-soft 6s ease-in-out infinite',
        'float-slow': 'float-slow 12s ease-in-out infinite'
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: 0.65 },
          '50%': { opacity: 1 }
        },
        'float-slow': {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
          '100%': { transform: 'translateY(0px)' }
        }
      }
    }
  },
  plugins: []
};

export default config;
