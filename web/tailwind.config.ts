import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': '#7B2FBE',
        'brand-purple-dark': '#5B2D8E',
        'brand-cyan': '#29B5E8',
        'brand-yellow': '#F5E042',
        'app-bg': '#F0F1F8',
        'app-surface': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
