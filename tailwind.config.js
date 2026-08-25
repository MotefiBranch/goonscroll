/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#101828',
        surface: '#0B0F19',
        card: '#161F30',
        border: '#1F2A3F',
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          subtle: '#1D4ED8',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
