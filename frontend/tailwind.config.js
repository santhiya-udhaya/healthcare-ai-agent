/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effcf9',
          100: '#c7f6ec',
          200: '#8fecd9',
          300: '#54dcc2',
          400: '#28c2a8',
          500: '#0fa38c',
          600: '#0a8272',
          700: '#0c675c',
          800: '#0f524a',
          900: '#0f443e',
        },
        ink: {
          50: '#f5f7f8',
          100: '#e8ecee',
          800: '#1c2530',
          900: '#0f1620',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(15, 82, 74, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
