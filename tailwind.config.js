/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // PRD Section 7.1 — Color Palette
      colors: {
        'navy':       '#1A1A2E',
        'red-elec':   '#E94560',
        'blue-dark':  '#0F3460',
        'off-white':  '#F5F5F5',
        'gold':       '#FFD700',
        'neon-green': '#00FF87',
        'orange-gym': '#FF6B35',
      },
      // PRD Section 7.1 — Fonts
      fontFamily: {
        heading: ['"Bebas Neue"', 'cursive'],
        body:    ['Inter', 'sans-serif'],
      },
      // Minimum tap target 44px — PRD Section 7.4
      minHeight: {
        tap: '44px',
      },
      minWidth: {
        tap: '44px',
      },
    },
  },
  plugins: [],
}
