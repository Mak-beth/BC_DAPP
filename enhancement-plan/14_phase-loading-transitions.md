# Phase 14 — Loading states & page transitions

## Goal
Add a generic `<Skeleton>` primitive, a top-of-page route-progress bar (thin indigo line that animates while navigating), and a page-level crossfade so route changes feel fluid. Replace remaining "Loading …" text placeholders with skeletons.

## Files in scope (ALLOWED to create/edit)
- `frontend/components/ui/Skeleton.tsx` (new)
- `frontend/components/RouteProgress.tsx` (new)
- `frontend/components/PageTransition.tsx` (new)
- `frontend/app/layout.tsx`
- `frontend/app/track/[id]/page.tsx` (replace loading text with skeletons)
- `frontend/app/audit/page.tsx` (replace loading text with skeletons)

## Files OUT of scope
- Dashboard already uses `ProductCardSkeleton` (Phase 07).
- Contract code, API routes.

## Dependencies
None new.

## Implementation steps

### 1. `frontend/components/ui/Skeleton.tsx`
```tsx
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-white/[0.05] animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] bg-[length:200%_100%]",
        className
      )}
    />
  );
}
```

### 2. `frontend/components/RouteProgress.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={pathname}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "left" }}
          className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-400 z-[70]"
        />
      )}
    </AnimatePresence>
  );
}
```

### 3. `frontend/components/PageTransition.tsx`
```tsx
"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### 4. Mount in `frontend/app/layout.tsx`
```tsx
import { RouteProgress } from "@/components/RouteProgress";
import { PageTransition } from "@/components/PageTransition";
// ...
<ToastProvider>
  <NetworkBanner />
  <RouteProgress />
  <Navbar />
  <main className="max-w-6xl mx-auto px-4 py-8">
    <PageTransition>{children}</PageTransition>
  </main>
</ToastProvider>
```

### 5. Replace remaining "Loading …" text

**`frontend/app/track/[id]/page.tsx`** — when `loading`, render:
```tsx
<div className="max-w-3xl mx-auto space-y-6">
  <Skeleton className="h-8 w-1/3" />
  <Skeleton className="h-4 w-1/4" />
  <Skeleton className="h-24 w-full rounded-xl" />
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20 md:col-span-2" />
  </div>
  <Skeleton className="h-32 w-full" />
</div>
```

**`frontend/app/audit/page.tsx`** — when `loading`, render:
```tsx
<div className="space-y-3">
  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
</div>
```

Import `Skeleton` from `@/components/ui/Skeleton` in both.

## Acceptance checks
- [ ] Clicking any nav link shows a thin indigo-cyan line sweep across the top of the page.
- [ ] The page content does a subtle fade/translate in and out when routes change.
- [ ] `/track/<id>` and `/audit` show shimmering skeleton placeholders while loading (no raw "Loading..." text).
- [ ] Reduced-motion OS setting collapses these animations (verified again in Phase 18).

## STOP — request user review
After finishing, post exactly: `Phase 14 complete — requesting review.`
