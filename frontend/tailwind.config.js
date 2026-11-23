/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#f0f7fa',
          100: '#dceef5',
          200: '#bcdbe7',
          300: '#8dc0d4',
          400: '#579eba',
          500: '#488099',
          600: '#36657c',
          700: '#2d4f66',
          800: '#22384a',
          900: '#1a2536',
          950: '#16202c',
        },
        brand: {
          50: '#f0f7fa',
          100: '#dceef5',
          200: '#bcdbe7',
          300: '#8dc0d4',
          400: '#579eba',
          500: '#488099',
          600: '#36657c',
          700: '#2d4f66',
          800: '#22384a',
          900: '#1a2536',
          950: '#16202c',
        }
      }
    },
  },
  plugins: [],
}
