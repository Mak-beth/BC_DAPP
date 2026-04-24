# Phase 22 — Theme overhaul (premium colour system + aurora background)

## Goal
Fix the "still looks generic" feeling. Replace the indigo/cyan Tailwind default with a **distinctive, cohesive palette** built around supply-chain semantics, add an **animated aurora background** (not just a grid), give surfaces real **depth** (multi-layer shadows, chromatic borders, subtle noise), and let the user **switch themes** from the navbar. Role badges, status pills, buttons, cards — everything gets re-skinned to look like one designed product, not a flat dashboard.

## Design direction — "Nebula Supply"

Three presets, all dark-first. Each has a signature hue, an accent hue, and role-tints for MANUFACTURER/DISTRIBUTOR/RETAILER.

| Theme | Base | Signature | Accent | Manufacturer | Distributor | Retailer | Status "Verified" |
|---|---|---|---|---|---|---|---|
| **Nebula** (default) | `#050814` | violet `#A855F7` | cyan `#06B6D4` | amber `#F59E0B` | rose `#FB7185` | emerald `#34D399` | gold `#FBBF24` |
| **Aurora** | `#041414` | mint `#5EEAD4` | sky `#38BDF8` | amber `#FBBF24` | pink `#F472B6` | emerald `#22C55E` | mint `#5EEAD4` |
| **Obsidian** (mono-warm) | `#0A0A0C` | slate `#E5E7EB` | bronze `#D97706` | bronze `#D97706` | rust `#EF4444` | sage `#84CC16` | bronze `#D97706` |

Gradient signatures (primary button, headings):
- Nebula: `linear-gradient(120deg, #A855F7 0%, #6366F1 35%, #06B6D4 100%)`
- Aurora: `linear-gradient(120deg, #5EEAD4 0%, #38BDF8 50%, #818CF8 100%)`
- Obsidian: `linear-gradient(120deg, #F3F4F6 0%, #D97706 100%)`

## Files in scope (ALLOWED to create/edit)
- `frontend/tailwind.config.ts`
- `frontend/app/globals.css`
- `frontend/lib/theme.tsx` (new — provider + `useTheme`)
- `frontend/components/ThemeSwitcher.tsx` (new)
- `frontend/components/AuroraBackground.tsx` (new)
- `frontend/components/Navbar.tsx` (mount switcher)
- `frontend/app/layout.tsx` (mount provider + aurora; remove old grid background)
- `frontend/components/ui/Button.tsx` (swap gradient to use CSS variables)
- `frontend/components/StatusBadge.tsx` (use themed status colours)
- `frontend/components/WalletConnect.tsx` (role glow uses theme variables)
- `frontend/components/StatTile.tsx` (accent map via vars)
- `frontend/app/track/[id]/_components/StatusProgressBar.tsx` (use theme vars)
- `frontend/app/verify/_components/AuthenticitySeal.tsx` (use "verified" theme colour)
- Any `text-gradient` use-site (headings on dashboard, verify, track, add-product) — no change needed; the class itself now reads from vars.

## Files OUT of scope
- Contract, API routes, DB.
- Business logic — only colours, shadows, and background.

## Dependencies
None new.

## Implementation steps

### 1. `frontend/app/globals.css` — replace entirely

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-inter: 'Inter', system-ui, sans-serif;
  --font-jetbrains: 'JetBrains Mono', ui-monospace, monospace;

  /* Nebula (default) */
  --bg-base:   #050814;
  --bg-raised: #0D1428;
  --bg-elev:   #111A33;

  --sig-1: #A855F7;  /* signature  */
  --sig-2: #6366F1;  /* mid        */
  --sig-3: #06B6D4;  /* accent     */

  --role-mfr: #F59E0B;
  --role-dst: #FB7185;
  --role-ret: #34D399;
  --verified: #FBBF24;

  --text-primary:   #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-muted:     #94A3B8;

  --border-subtle: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.16);

  --glow-sig:   0 0 32px rgba(168, 85, 247, 0.35);
  --glow-sig-2: 0 0 48px rgba(99, 102, 241, 0.30);

  --gradient-sig: linear-gradient(120deg, var(--sig-1) 0%, var(--sig-2) 35%, var(--sig-3) 100%);
}

html.theme-aurora {
  --bg-base:   #041414;
  --bg-raised: #062A2A;
  --bg-elev:   #083636;
  --sig-1: #5EEAD4;
  --sig-2: #38BDF8;
  --sig-3: #818CF8;
  --role-mfr: #FBBF24;
  --role-dst: #F472B6;
  --role-ret: #22C55E;
  --verified: #5EEAD4;
  --glow-sig:   0 0 32px rgba(94, 234, 212, 0.35);
  --glow-sig-2: 0 0 48px rgba(56, 189, 248, 0.30);
  --gradient-sig: linear-gradient(120deg, var(--sig-1) 0%, var(--sig-2) 50%, var(--sig-3) 100%);
}

html.theme-obsidian {
  --bg-base:   #0A0A0C;
  --bg-raised: #141418;
  --bg-elev:   #1C1C22;
  --sig-1: #F3F4F6;
  --sig-2: #A3A3A3;
  --sig-3: #D97706;
  --role-mfr: #D97706;
  --role-dst: #EF4444;
  --role-ret: #84CC16;
  --verified: #D97706;
  --glow-sig:   0 0 32px rgba(217, 119, 6, 0.35);
  --glow-sig-2: 0 0 48px rgba(217, 119, 6, 0.15);
  --gradient-sig: linear-gradient(120deg, var(--sig-1) 0%, var(--sig-3) 100%);
}

html, body {
  background: var(--bg-base);
  color: var(--text-primary);
  min-height: 100%;
}

/* Remove the old grid (now handled by <AuroraBackground>) */
body::before, body::after { content: none; }

/* Subtle film-grain overlay for depth */
body {
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0);
  background-size: 3px 3px;
}

/* Themed gradient text */
.text-gradient {
  background: var(--gradient-sig);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Gradient rule for primary buttons */
.bg-gradient-sig      { background: var(--gradient-sig); }
.shadow-sig           { box-shadow: var(--glow-sig); }
.shadow-sig-soft      { box-shadow: var(--glow-sig-2); }

/* Glass surface */
.surface-glass {
  background: color-mix(in srgb, var(--bg-raised) 55%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--border-subtle);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.04) inset,
    0 10px 30px -12px rgba(0,0,0,0.55);
}
.surface-glass-strong {
  background: color-mix(in srgb, var(--bg-raised) 82%, transparent);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-strong);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.06) inset,
    0 18px 60px -18px rgba(0,0,0,0.65);
}

/* Role-tinted surfaces — used on dashboard/track headers */
.surface-tint-mfr { box-shadow: 0 0 0 1px color-mix(in srgb, var(--role-mfr) 35%, transparent), 0 0 48px -8px color-mix(in srgb, var(--role-mfr) 35%, transparent); }
.surface-tint-dst { box-shadow: 0 0 0 1px color-mix(in srgb, var(--role-dst) 35%, transparent), 0 0 48px -8px color-mix(in srgb, var(--role-dst) 35%, transparent); }
.surface-tint-ret { box-shadow: 0 0 0 1px color-mix(in srgb, var(--role-ret) 35%, transparent), 0 0 48px -8px color-mix(in srgb, var(--role-ret) 35%, transparent); }

/* Aurora "blob" shapes animated slowly */
@keyframes auroraDrift {
  0%   { transform: translate3d(0,0,0) scale(1); }
  50%  { transform: translate3d(6%,-4%,0) scale(1.08); }
  100% { transform: translate3d(0,0,0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

### 2. `frontend/tailwind.config.ts` — extend with CSS-var-driven tokens

Replace the `theme.extend` block with:

```ts
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
```

Keep `darkMode: 'class'`. Do NOT drop the pre-existing `content` array.

### 3. `frontend/components/AuroraBackground.tsx` (new)
```tsx
"use client";

export function AuroraBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
      {/* Big signature blob */}
      <div
        className="absolute -top-40 -left-40 w-[55rem] h-[55rem] rounded-full blur-3xl opacity-60 animate-aurora-drift"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sig-1) 35%, transparent), transparent 70%)" }}
      />
      {/* Accent blob */}
      <div
        className="absolute -bottom-40 -right-40 w-[50rem] h-[50rem] rounded-full blur-3xl opacity-50 animate-aurora-drift"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sig-3) 30%, transparent), transparent 70%)", animationDelay: "6s" }}
      />
      {/* Mid accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] rounded-full blur-3xl opacity-25 animate-aurora-drift"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sig-2) 40%, transparent), transparent 70%)", animationDelay: "12s" }}
      />
      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />
    </div>
  );
}
```

### 4. `frontend/lib/theme.tsx` (new)
```tsx
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "nebula" | "aurora" | "obsidian";
const STORAGE_KEY = "sc-theme";
const LIST: ThemeName[] = ["nebula", "aurora", "obsidian"];
const LABELS: Record<ThemeName, string> = { nebula: "Nebula", aurora: "Aurora", obsidian: "Obsidian" };

interface Ctx {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  list: ThemeName[];
  labels: typeof LABELS;
}
const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("nebula");

  useEffect(() => {
    const saved = (typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null) as ThemeName | null;
    if (saved && LIST.includes(saved)) setThemeState(saved);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("theme-nebula", "theme-aurora", "theme-obsidian");
    if (theme !== "nebula") html.classList.add(`theme-${theme}`); // nebula is the default (no class = nebula vars)
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, list: LIST, labels: LABELS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
```

### 5. `frontend/components/ThemeSwitcher.tsx` (new)
```tsx
"use client";

import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";

export function ThemeSwitcher() {
  const { theme, setTheme, list, labels } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-label="Change theme"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border-subtle bg-white/[0.04] text-content-subtle hover:text-white hover:border-border-strong transition-colors"
      >
        <Sparkles className="w-4 h-4" style={{ color: "var(--sig-1)" }} />
        <span className="text-xs font-medium">{labels[theme]}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-40 rounded-lg border border-border-strong surface-glass-strong p-1 z-50"
            onMouseLeave={() => setOpen(false)}
          >
            {list.map((t) => (
              <li key={t}>
                <button
                  onClick={() => { setTheme(t); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm",
                    t === theme ? "bg-white/10 text-white" : "text-content-subtle hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: `var(--sig-1)`, boxShadow: `0 0 8px var(--sig-1)` }} />
                  {labels[t]}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 6. `frontend/app/layout.tsx` — mount provider + aurora
```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletContext";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/Toast";
import { AuroraBackground } from "@/components/AuroraBackground";
import { NetworkBanner } from "@/components/NetworkBanner";
import { RouteProgress } from "@/components/RouteProgress";
import { PageTransition } from "@/components/PageTransition";
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
      <body className="font-sans bg-bg-base text-content min-h-screen antialiased">
        <ThemeProvider>
          <WalletProvider>
            <ToastProvider>
              <AuroraBackground />
              <NetworkBanner />
              <RouteProgress />
              <Navbar />
              <main className="max-w-6xl mx-auto px-4 py-8">
                <PageTransition>{children}</PageTransition>
              </main>
            </ToastProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 7. `frontend/components/Navbar.tsx` — mount the switcher
In the right-side group (where `<WalletConnect />` lives), add before it:
```tsx
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
// ...
<div className="hidden sm:flex items-center gap-2">
  <ThemeSwitcher />
  <WalletConnect />
</div>
```
Also update the logo square to use the themed gradient: replace `bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-glow` with `bg-gradient-sig shadow-sig`.
Change the active-link pill colours from indigo-specific to themed: replace `bg-gradient-to-br from-indigo-500/30 to-cyan-400/20 border border-indigo-400/40 shadow-glow` with `bg-[color:var(--sig-1)]/15 border border-[color:var(--sig-1)]/40 shadow-sig-sm`. Add a subtle inner gradient via pseudo-element if desired.

### 8. `frontend/components/ui/Button.tsx` — themed primary
Replace the `variants.primary` entry with:
```ts
primary:
  "bg-gradient-sig text-white hover:shadow-sig border border-white/10",
```
Replace the hardcoded `focus-visible:ring-indigo-400` on `Button` with `focus-visible:ring-[color:var(--sig-1)]`.

### 9. `frontend/components/StatusBadge.tsx` — themed palette
```tsx
import type { ProductStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

interface StatusBadgeProps { status: ProductStatus; pulse?: boolean; }

// Themed: CREATED uses sig-1 (signature), IN_TRANSIT uses sig-2, DELIVERED uses sig-3, SOLD uses verified gold.
const styleMap: Record<ProductStatus, string> = {
  CREATED:    "bg-[color:var(--sig-1)]/15     text-[color:var(--sig-1)]     border border-[color:var(--sig-1)]/40",
  IN_TRANSIT: "bg-[color:var(--sig-2)]/15     text-[color:var(--sig-2)]     border border-[color:var(--sig-2)]/40",
  DELIVERED:  "bg-[color:var(--sig-3)]/15     text-[color:var(--sig-3)]     border border-[color:var(--sig-3)]/40",
  SOLD:       "bg-[color:var(--verified)]/15  text-[color:var(--verified)]  border border-[color:var(--verified)]/40",
};
const labels: Record<ProductStatus, string> = { CREATED: "Created", IN_TRANSIT: "In Transit", DELIVERED: "Delivered", SOLD: "Sold" };

export default function StatusBadge({ status, pulse }: StatusBadgeProps) {
  const autoPulse = pulse ?? status === "IN_TRANSIT";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
      styleMap[status],
      autoPulse && "animate-pulse-glow"
    )}>
      {autoPulse && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {labels[status]}
    </span>
  );
}
```

### 10. `frontend/components/WalletConnect.tsx` — themed role glow
Replace the `roleGlow` map with CSS variable driven:
```ts
const roleGlow: Record<UserRole, string> = {
  NONE:         "bg-white/5 text-content-muted border border-border-subtle",
  MANUFACTURER: "bg-[color:var(--role-mfr)]/15 text-[color:var(--role-mfr)] border border-[color:var(--role-mfr)]/40 shadow-[0_0_18px_color-mix(in_srgb,var(--role-mfr)_30%,transparent)]",
  DISTRIBUTOR:  "bg-[color:var(--role-dst)]/15 text-[color:var(--role-dst)] border border-[color:var(--role-dst)]/40 shadow-[0_0_18px_color-mix(in_srgb,var(--role-dst)_30%,transparent)]",
  RETAILER:     "bg-[color:var(--role-ret)]/15 text-[color:var(--role-ret)] border border-[color:var(--role-ret)]/40 shadow-[0_0_18px_color-mix(in_srgb,var(--role-ret)_30%,transparent)]",
};
```

### 11. `frontend/components/StatTile.tsx` — themed accents
Replace `accentMap`:
```ts
const accentMap = {
  indigo:  { bg: "var(--sig-1)",    text: "var(--sig-1)" },
  amber:   { bg: "var(--role-mfr)", text: "var(--role-mfr)" },
  sky:     { bg: "var(--sig-3)",    text: "var(--sig-3)" },
  emerald: { bg: "var(--role-ret)", text: "var(--role-ret)" },
} as const;
```
And use them inline:
```tsx
<div
  className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-60"
  style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${accentMap[accent].bg} 40%, transparent), transparent 70%)` }}
/>
<div
  className="grid place-items-center w-10 h-10 rounded-lg"
  style={{ background: `color-mix(in srgb, ${accentMap[accent].bg} 18%, transparent)`, color: accentMap[accent].text }}
>{icon}</div>
```

### 12. `frontend/app/track/[id]/_components/StatusProgressBar.tsx`
Swap the hard-coded indigo/emerald classes for theme variables. Active stage uses `var(--sig-1)`; done stages use `var(--role-ret)`; connector gradient goes from emerald to emerald but keep the same look. Use inline styles where Tailwind arbitrary values get awkward:
```tsx
active && "ring-2"
// style for active border/shadow:
style={active ? { borderColor: "var(--sig-1)", boxShadow: "var(--glow-sig)" } : undefined}
```

### 13. `frontend/app/verify/_components/AuthenticitySeal.tsx`
Replace the hard-coded `from-emerald-400/30 to-sky-400/30` glow with `var(--verified)` and `var(--sig-3)`:
```tsx
<span className="absolute inset-0 rounded-full blur-xl"
  style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--verified) 40%, transparent) 0%, transparent 70%)" }} />
<span className="absolute inset-0 rounded-full p-[2px]"
  style={{ background: "linear-gradient(135deg, var(--verified), var(--sig-3))" }}>
  <span className="block w-full h-full rounded-full bg-bg-raised" />
</span>
<ShieldCheck className="relative w-10 h-10" style={{ color: "var(--verified)" }} />
```

### 14. Role-tinted dashboard header
In `frontend/app/dashboard/page.tsx`, wrap the `<motion.header>` in a themed tint:
```tsx
const roleTint =
  walletState.role === "MANUFACTURER" ? "surface-tint-mfr"
  : walletState.role === "DISTRIBUTOR" ? "surface-tint-dst"
  : walletState.role === "RETAILER"    ? "surface-tint-ret"
  : "";
// ...
<motion.header
  className={cn("rounded-2xl surface-glass p-6", roleTint)}
  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
>
  ...
</motion.header>
```

## Acceptance checks
- [ ] The navbar shows a "Nebula" button next to the wallet; clicking it lets you pick **Nebula / Aurora / Obsidian**; the whole page retints instantly without reloading.
- [ ] The picked theme persists across reloads (localStorage).
- [ ] The page background is no longer a grid — it's slow-drifting coloured aurora blobs + a vignette + subtle film-grain. On Aurora and Obsidian the blob colours match the theme.
- [ ] Buttons, headings, logo square, status pills, role badges, stat-tile accents, track-page progress bar, and verify seal all shift colour when theme changes.
- [ ] Manufacturer connected: dashboard header has a soft amber ring + glow. Distributor: rose. Retailer: emerald.
- [ ] Setting the OS to reduce-motion freezes the aurora blobs.
- [ ] `npm run build` clean; no TypeScript errors.

## STOP — request user review
After finishing, post exactly: `Phase 22 complete — requesting review.`
