/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Light mode colors
        background: '#FFFFFF',
        surface: '#F7FAFC',
        'text-primary': '#1A202C',
        'text-secondary': '#718096',
        accent: '#4299E1',
        'accent-hover': '#3182CE',
        error: '#E53E3E',
        success: '#38A169',
        border: '#E2E8F0',

        // Dark mode colors
        'dark-bg': '#0F172A',
        'dark-surface': '#1E293B',
        'dark-card': '#334155',
        'dark-text-primary': '#F1F5F9',
        'dark-text-secondary': '#94A3B8',
        'dark-border': '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
