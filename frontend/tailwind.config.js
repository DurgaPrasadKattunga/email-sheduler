/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e0fd',
          300: '#b4c7fb',
          400: '#8ca6f7',
          500: '#637ef1',
          600: '#4f61e6',
          700: '#3d4ac8',
          800: '#333da2',
          900: '#2d3680',
          950: '#1b204e',
        },
      },
    },
  },
  plugins: [],
};
