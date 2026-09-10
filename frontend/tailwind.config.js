/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#2E7D32', // Fresh action green
          600: '#266B2A',
          700: '#1D5522',
          800: '#1B4D3E', // Primary Forest Brand Green
          900: '#12372A',
          950: '#0B231A',
        },
        warm: {
          50: '#FBFBF8',
          100: '#F5F5F0',
          200: '#EAEAE0',
          300: '#DCDCCB',
          400: '#C2C2AA',
          500: '#9E9E82',
          600: '#7B7B61',
          700: '#5C5C48',
          800: '#3D3D30',
          900: '#24241C',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706', // Golden accent
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        slate: {
          850: '#172033',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
      },
      borderRadius: {
        'km': '0.625rem', // 10px
      }
    },
  },
  plugins: [],
}
