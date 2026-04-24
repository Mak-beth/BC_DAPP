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
          base:   'var(--bg-base)',
          raised: 'var(--bg-raised)',
          elev:   'var(--bg-elev)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        sig: {
          1: 'var(--sig-1)',
          2: 'var(--sig-2)',
          3: 'var(--sig-3)',
        },
        role: {
          mfr: 'var(--role-mfr)',
          dst: 'var(--role-dst)',
          ret: 'var(--role-ret)',
        },
        verified: 'var(--verified)',
        content: {
          DEFAULT: 'var(--text-primary)',
          muted:   'var(--text-muted)',
          subtle:  'var(--text-secondary)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        sig:      '0 0 32px rgba(168, 85, 247, 0.35)',
        'sig-sm': '0 0 18px rgba(168, 85, 247, 0.30)',
        depth:    '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -12px rgba(0,0,0,0.55)',
      },
      keyframes: {
        fadeInUp:  { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 0 0 rgba(168,85,247,0.4)' }, '50%': { boxShadow: '0 0 0 10px rgba(168,85,247,0)' } },
        auroraDrift: { '0%': { transform: 'translate3d(0,0,0) scale(1)' }, '50%': { transform: 'translate3d(6%,-4%,0) scale(1.08)' }, '100%': { transform: 'translate3d(0,0,0) scale(1)' } },
      },
      animation: {
        'fade-in-up':   'fadeInUp 0.42s cubic-bezier(0.16,1,0.3,1) both',
        shimmer:        'shimmer 1.8s linear infinite',
        'pulse-glow':   'pulseGlow 2.2s ease-in-out infinite',
        'aurora-drift': 'auroraDrift 22s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
