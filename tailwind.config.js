/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0effe',
          100: '#dddcfc',
          200: '#bdbaf8',
          300: '#9b96f3',
          400: '#7b74ed',
          500: '#5a52e0',
          600: '#4640c8',
          700: '#3530a8',
          800: '#252285',
          900: '#181662',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
