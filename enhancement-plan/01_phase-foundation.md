# Phase 01 — Design System Foundation

## Goal
Install the motion + icon libraries and wire up the Tailwind + CSS foundation the rest of the phases will depend on. After this phase the app still looks mostly the same, but the background is a subtle animated grid, fonts are crisp, and every future phase can import motion/icons without adding dependencies.

## Files in scope (ALLOWED to create/edit)
- `frontend/package.json` (via npm install)
- `frontend/tailwind.config.ts`
- `frontend/app/globals.css`
- `frontend/app/layout.tsx`

## Files OUT of scope (MUST NOT edit)
- `hardhat-project/**`
- Any component / page file not listed above

## Dependencies to install (run ONCE in `frontend/`)
```bash
npm install framer-motion lucide-react clsx tailwind-merge
```

## Implementation steps

### 1. `frontend/tailwind.config.ts` — extend theme
Replace the contents with the config below (preserves `darkMode` and `content` paths from the existing file, extends theme):

```ts
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
```

### 2. `frontend/app/globals.css` — replace contents
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-inter: 'Inter', system-ui, sans-serif;
  --font-jetbrains: 'JetBrains Mono', ui-monospace, monospace;
}

html, body {
  @apply bg-bg-base text-gray-100;
  min-height: 100%;
}

/* Animated grid background */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -2;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: gridMove 24s linear infinite;
  mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
}

/* Soft indigo glow behind content */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(60rem 40rem at 20% 10%, rgba(99,102,241,0.12), transparent 70%),
    radial-gradient(50rem 32rem at 90% 80%, rgba(14,165,233,0.10), transparent 70%);
  pointer-events: none;
}

/* Reduced-motion kill-switch (fully enforced in Phase 18) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Utility: gradient text */
.text-gradient {
  background: linear-gradient(90deg, #818CF8, #22D3EE);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

### 3. `frontend/app/layout.tsx` — load fonts and swap body classes
Replace with:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletContext";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Supply Chain DApp — Group 13",
  description: "Blockchain-based tamper-proof product tracking | CT124-3-3-BCD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans bg-bg-base text-gray-100 min-h-screen antialiased">
        <WalletProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
```

## Acceptance checks (user verifies)
- [ ] `npm run build` in `frontend/` finishes with no errors.
- [ ] `npm run dev` loads `http://localhost:3000/dashboard` successfully.
- [ ] The background shows a faint animated grid + two soft glows (indigo top-left, sky bottom-right).
- [ ] Text is rendered in Inter (no default serif fallback).
- [ ] All existing pages (`/dashboard`, `/verify`, `/audit`) load without runtime errors.

## STOP — request user review
After finishing, post exactly: `Phase 01 complete — requesting review.` Do NOT start Phase 02 without explicit approval.
