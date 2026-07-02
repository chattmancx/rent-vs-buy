/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#F7F6F3',
          panel: '#FFFFFF',
          rule: '#E2DDD6',
        },
        ink: {
          primary: '#1A1A18',
          secondary: '#4A4845',
          muted: '#8C8884',
        },
        signal: {
          buy: '#3B6EA5',
          rent: '#7A6E5F',
          benefit: '#2E6B4F',
          negative: '#8B3A3A',
        },
        accent: {
          DEFAULT: '#4A7C59',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
