
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#06b6d4', // Cyan-500 (Neon Blue)
        primaryDark: '#0891b2',
        background: '#0f172a', // Slate-900 (Deep Space Blue)
        surface: '#1e293b', // Slate-800
        surfaceLight: '#334155', // Slate-700
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(6, 182, 212, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      screens: {
        'tablet': '1024px', // Tablet breakpoint
        'small': '768px',   // Small screens
        'compact': '600px'  // Compact screens
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxHeight: {
        '96': '24rem',
        'screen-75': '75vh',
        'screen-85': '85vh',
      }
    },
  },
  plugins: [],
}
