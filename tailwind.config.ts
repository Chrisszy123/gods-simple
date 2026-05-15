import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        gold: '#FEBF53',
        'gold-dark': '#C9960A',
        'gold-light': '#FFD97A',
        'orange-red': '#D5421E',
        surface: '#0D0D0D',
        'surface-2': '#161616',
      },
      fontFamily: {
        cogs: ['CogsAndBolts', 'Impact', 'sans-serif'],
        nexa: ['Nexa', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.04' },
          '50%': { opacity: '0.12' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        glow: 'glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
