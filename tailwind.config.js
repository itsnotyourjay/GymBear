/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Legacy tokens (kept for backward-compat)
      colors: {
        'navy':       '#1A1A2E',
        'red-elec':   '#E94560',
        'blue-dark':  '#0F3460',
        'off-white':  '#F5F5F5',
        'gold':       '#FFD700',
        'neon-green': '#00FF87',
        'orange-gym': '#FF6B35',
        // New design-system palette (Enhancement §1.1)
        bear: {
          void:    '#090912',
          abyss:   '#0D0D1A',
          deep:    '#12122A',
          surface: '#1A1A3E',
          rim:     '#252560',
          muted:   '#3A3A7A',
          text:    '#C8C8F0',
          bright:  '#E8E8FF',
        },
        ember:  { DEFAULT: '#FF3D5A', dark: '#CC1F3A', glow: 'rgba(255,61,90,0.35)' },
        plasma: { DEFAULT: '#7B5EFF', dark: '#5A3FCC', glow: 'rgba(123,94,255,0.35)' },
        neon:   { DEFAULT: '#00F5C4', dark: '#00B894', glow: 'rgba(0,245,196,0.25)' },
        iron:   { 50: '#F0F0FF', 100: '#C8C8FF', 200: '#9898E8', 300: '#6868C8', 400: '#3838A8' },
      },
      // Fonts
      fontFamily: {
        heading: ['"Bebas Neue"', 'cursive'],
        body:    ['Inter', 'sans-serif'],
        display: ['"Bebas Neue"', 'cursive'],
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      // Minimum tap target 44px
      minHeight: { tap: '44px' },
      minWidth:  { tap: '44px' },
    },
  },
  plugins: [],
}
