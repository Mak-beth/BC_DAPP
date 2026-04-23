import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#0B0F1A',
          raised:  '#111726',
          overlay: 'rgba(255,255,255,0.03)',
        },
        border: {
          subtle: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.16)',
        },
        brand: {
          indigo: '#6366F1',
          sky:    '#0EA5E9',
          cyan:   '#22D3EE',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 32px rgba(99, 102, 241, 0.35)',
        'glow-sky': '0 0 24px rgba(14, 165, 233, 0.35)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(99,102,241,0)' },
        },
        gridMove: {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '48px 48px' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.42s cubic-bezier(0.16,1,0.3,1) both',
        shimmer:      'shimmer 1.8s linear infinite',
        'pulse-glow': 'pulseGlow 2.2s ease-in-out infinite',
        'grid-move':  'gridMove 24s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
