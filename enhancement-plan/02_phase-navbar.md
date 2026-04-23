# Phase 02 — Navbar redesign

## Goal
Replace the flat gray navbar with a premium glass navbar that has an animated active-link "pill" (using framer-motion `layoutId`), a gradient wordmark, a lucide logo icon, and a mobile hamburger that opens a slide-in drawer. The user should feel the upgrade immediately on page load.

## Files in scope (ALLOWED to create/edit)
- `frontend/components/Navbar.tsx`

## Files OUT of scope (MUST NOT edit)
- Anything else

## Dependencies
Already installed in Phase 01 (`framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`). No new installs.

## Implementation steps

### 1. Rewrite `frontend/components/Navbar.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Menu, X } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import WalletConnect from "./WalletConnect";

const links = [
  { href: "/dashboard",   label: "Dashboard",   role: "any" as const },
  { href: "/add-product", label: "Add Product", role: "MANUFACTURER" as const },
  { href: "/verify",      label: "Verify",      role: "any" as const },
  { href: "/audit",       label: "Audit",       role: "any" as const },
];

export default function Navbar() {
  const pathname = usePathname();
  const { walletState } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = links.filter(
    (l) => l.role === "any" || walletState.role === l.role
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base/60 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo + desktop links */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-glow">
              <Link2 className="w-4 h-4 text-white" />
            </span>
            <span className="text-gradient text-lg font-bold tracking-tight">
              SupplyChain DApp
            </span>
          </Link>
          <ul className="hidden md:flex items-center gap-1 relative">
            {visibleLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className="relative px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-md bg-gradient-to-br from-indigo-500/30 to-cyan-400/20 border border-indigo-400/40 shadow-glow"
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                      />
                    )}
                    <span className={`relative ${active ? "text-white" : ""}`}>
                      {link.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <WalletConnect />
          </div>
          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden grid place-items-center w-9 h-9 rounded-md border border-border-subtle text-gray-300 hover:text-white hover:border-border-strong"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-border-subtle bg-bg-base/80 backdrop-blur-xl"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {visibleLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-indigo-500/20 text-white border border-indigo-400/40"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-border-subtle mt-2 sm:hidden">
                <WalletConnect />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
```

## Acceptance checks
- [ ] Navbar is translucent with `backdrop-blur` — content scrolling underneath is visibly blurred.
- [ ] The active-link pill **animates between links** when navigating (spring physics, not jump-cut).
- [ ] Logo shows a small indigo-cyan gradient square with a `Link2` icon; wordmark has gradient text.
- [ ] On mobile-width (≤768px), a hamburger shows; tapping it slides a drawer with the same links.
- [ ] Manufacturer-only link "Add Product" still only appears when the connected wallet has MANUFACTURER role.

## STOP — request user review
After finishing, post exactly: `Phase 02 complete — requesting review.`
