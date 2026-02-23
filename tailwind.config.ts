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
        ink: '#0F0E0C',
        'ink-2': '#2A2925',
        muted: '#6E6B63',
        faint: '#B5B2AA',
        paper: '#FAF9F6',
        cream: '#F2EFE8',
        line: '#E4E0D8',
        amber: '#D4820A',
        'amber-pale': '#FDF3E3',
        green: '#1A6644',
        'green-pale': '#E8F5EE',
        pop: '#E8420E',
        'pop-pale': '#FEF0EB',
        indigo: '#2D4A6B',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        body: ['Instrument Sans', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
