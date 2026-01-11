/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F7FAFC',
        text: {
          primary: '#1A202C',
          secondary: '#718096',
        },
        accent: {
          DEFAULT: '#4299E1',
          hover: '#3182CE',
        },
        border: '#E2E8F0',
        success: '#38A169',
        error: '#E53E3E',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
