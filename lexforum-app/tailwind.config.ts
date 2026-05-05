import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'navy-deep': '#0F1E2E',
        navy:        '#1A3A5C',
        'lex-cyan':  '#00D4FF',
        'lex-cyan-dark': '#0099CC',
        'white-ice': '#F8FAFC',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'Cambria', 'serif'],
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0F1E2E 0%, #1A3A5C 60%, #0F1E2E 100%)',
      },
    },
  },
  plugins: [],
}
export default config
