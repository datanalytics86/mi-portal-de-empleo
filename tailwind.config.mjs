/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-sans)',
          '"Plus Jakarta Sans"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        display: [
          'var(--font-display)',
          'Newsreader',
          'Georgia',
          'serif',
        ],
      },
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'oklch(var(--success) / <alpha-value>)',
          foreground: 'oklch(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'oklch(var(--warning) / <alpha-value>)',
          foreground: 'oklch(var(--warning-foreground) / <alpha-value>)',
        },
        /* Compatibility: leftover brand-* maps to the teal accent, never indigo */
        brand: {
          50: 'oklch(var(--accent) / 0.10)',
          100: 'oklch(var(--accent) / 0.16)',
          200: 'oklch(var(--accent) / 0.28)',
          300: 'oklch(var(--accent) / 0.42)',
          400: 'oklch(var(--accent) / 0.62)',
          500: 'oklch(var(--accent) / 0.82)',
          600: 'oklch(var(--accent) / 1)',
          700: 'oklch(var(--accent) / 1)',
          800: 'oklch(var(--accent) / 1)',
          900: 'oklch(var(--accent) / 1)',
        },
      },
      borderRadius: {
        input: 'var(--radius-input)',
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
        map: 'var(--radius-map)',
        mark: 'var(--radius-mark)',
      },
      boxShadow: {
        quiet: 'var(--shadow-quiet)',
        map: 'var(--shadow-map)',
        soft: 'var(--shadow-quiet)',
        card: 'var(--shadow-quiet)',
        'card-hover': 'var(--shadow-quiet)',
        glow: 'none',
      },
      maxWidth: {
        measure: 'var(--measure)',
      },
      transitionTimingFunction: {
        quiet: 'var(--ease-quiet)',
        enter: 'var(--ease-enter)',
      },
      transitionDuration: {
        micro: 'var(--duration-micro)',
        move: 'var(--duration-move)',
        enter: 'var(--duration-enter)',
      },
    },
  },
  plugins: [],
};
