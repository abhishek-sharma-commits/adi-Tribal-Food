import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#FF385C', dark: '#E31C5F', soft: '#FFF0F3' },
        ink: { DEFAULT: '#222222', muted: '#717171' },
        surface: '#F7F7F7',
        line: '#DDDDDD',
      },
      fontFamily: { sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '16px' },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.06)',
        lift: '0 6px 20px rgba(0,0,0,0.12)',
        pill: '0 2px 10px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [typography],
};
