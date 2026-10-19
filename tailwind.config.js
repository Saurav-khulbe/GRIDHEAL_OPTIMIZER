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
        solar: '#F5B301',
        battery: '#2DD4BF',
        grid: '#60A5FA',
        flexible: '#A78BFA',
        critical: '#F87171',
        surplus: '#4ADE80',
        canvas: {
          dark: '#0B0F17',
          card: '#131B2E',
          border: '#1E293B',
          light: '#F8FAFC',
          cardLight: '#FFFFFF',
          borderLight: '#E2E8F0',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Space Grotesk', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
