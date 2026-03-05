import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'cis-navy': '#1B3A5C',
        'cis-red': '#B91C1C',
        'cis-orange': '#E87722',
        'cis-dark': '#0F2337',
        'cis-light': '#F5F7FA',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 119, 34, 0.4)' }, '50%': { boxShadow: '0 0 20px 4px rgba(232, 119, 34, 0.2)' } },
      },
    },
  },
  plugins: [],
}
export default config
