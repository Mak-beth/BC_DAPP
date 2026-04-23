# Phase 03 — Reusable Button component

## Goal
Introduce a single `<Button>` component used across the app. Hover lifts and glows; click produces a soft ripple; loading state swaps to a spinner. Every existing inline `bg-blue-600 hover:bg-blue-700 ...` button gets replaced with this component so the visual language is consistent.

## Files in scope (ALLOWED to create/edit)
- `frontend/components/ui/Button.tsx` (new)
- `frontend/lib/cn.ts` (new — tiny clsx+tailwind-merge helper)
- `frontend/app/dashboard/page.tsx`
- `frontend/app/add-product/page.tsx`
- `frontend/app/verify/page.tsx`
- `frontend/components/WalletConnect.tsx`

## Files OUT of scope (MUST NOT edit)
- Contract, API routes, track/audit pages, anything else

## Dependencies
Already installed (`framer-motion`, `clsx`, `tailwind-merge`, `lucide-react`).

## Implementation steps

### 1. `frontend/lib/cn.ts`
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 2. `frontend/components/ui/Button.tsx`
```tsx
"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-indigo-500 to-cyan-500 text-white hover:shadow-glow border border-indigo-400/40",
  secondary:
    "bg-white/[0.04] text-gray-100 border border-border-subtle hover:bg-white/[0.08] hover:border-border-strong",
  ghost:
    "bg-transparent text-gray-300 hover:bg-white/5 hover:text-white border border-transparent",
  danger:
    "bg-rose-500/15 text-rose-200 border border-rose-500/40 hover:bg-rose-500/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-5 text-base rounded-lg gap-2.5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, className, children, disabled, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileHover={disabled || loading ? {} : { y: -1 }}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...(rest as any)}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      <span>{children}</span>
    </motion.button>
  );
});
```

### 3. Replace inline buttons

**`frontend/app/dashboard/page.tsx`** — replace the "Track Product" `<Link>` styled as a button by swapping the `className` stack to wrap the `<Link>` content in `<Button asChild>` pattern. Simplest path: keep the `<Link>` but match Button's classes. Use:
```tsx
import { Button } from "@/components/ui/Button";
// ...
<Link href={`/track/${p.id}`} className="block">
  <Button size="sm" className="w-full">Track Product</Button>
</Link>
```

**`frontend/app/add-product/page.tsx`** — submit button:
```tsx
import { Button } from "@/components/ui/Button";
// Inside form:
<Button type="submit" loading={loading} size="lg" className="w-full">
  {loading ? (status || "Processing...") : "Add Product"}
</Button>
```

**`frontend/app/verify/page.tsx`** — verify submit:
```tsx
import { Button } from "@/components/ui/Button";
<Button type="submit" loading={loading}>Verify</Button>
```
And the "View Full History →" anchor gets wrapped:
```tsx
<Link href={`/track/${productId}`}><Button variant="secondary" size="sm">View Full History →</Button></Link>
```

**`frontend/components/WalletConnect.tsx`** — connect button, cancel + register buttons in the modal:
```tsx
import { Button } from "@/components/ui/Button";
// connect
<Button onClick={handleConnect} loading={connectState === "connecting"} size="sm">
  Connect Wallet
</Button>
// cancel
<Button variant="ghost" onClick={() => { setModalState("hidden"); setConnectState("idle"); }}>Cancel</Button>
// register submit
<Button type="submit">Register</Button>
```

The **disconnect** link should become `<Button variant="ghost" size="sm" onClick={handleDisconnect}>Disconnect</Button>`.

## Acceptance checks
- [ ] Every primary action button now has the indigo→cyan gradient.
- [ ] Hovering any button lifts it 1px and shows a soft glow.
- [ ] Clicking any button scales to ~97% briefly (tactile feedback).
- [ ] Submit buttons show a spinner + label when `loading` is true.
- [ ] Disabled buttons are 50% opacity and do not respond to hover.
- [ ] No TypeScript errors; `npm run build` clean.

## STOP — request user review
After finishing, post exactly: `Phase 03 complete — requesting review.`
