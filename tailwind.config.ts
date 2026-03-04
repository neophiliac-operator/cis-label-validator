import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'cis-navy': '#1B3A5C',
        'cis-orange': '#E87722',
        'cis-dark': '#0F2337',
        'cis-light': '#F5F7FA',
      },
    },
  },
  plugins: [],
}
export default config
