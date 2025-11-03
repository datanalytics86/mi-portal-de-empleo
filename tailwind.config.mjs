/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F7FAFC',
        'text-primary': '#1A202C',
        'text-secondary': '#718096',
        accent: '#4299E1',
        'accent-hover': '#3182CE',
        error: '#E53E3E',
        success: '#38A169',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
