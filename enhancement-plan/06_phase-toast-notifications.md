# Phase 06 — Toast notifications

## Goal
Replace every inline red error banner (`bg-red-900/50 ...`) with a portal-mounted toast that slides in from the top-right. Success / error / info / warning variants. Auto-dismiss with progress bar. A toast hook (`useToast`) exposes `toast.success()`, `toast.error()`, etc.

## Files in scope (ALLOWED to create/edit)
- `frontend/components/ui/Toast.tsx` (new — provider + hook + renderer all in one file)
- `frontend/app/layout.tsx` (wrap children in `<ToastProvider>`)
- `frontend/app/dashboard/page.tsx`
- `frontend/app/add-product/page.tsx`
- `frontend/app/verify/page.tsx`
- `frontend/components/WalletConnect.tsx`

## Files OUT of scope
- Everything else.

## Dependencies
None new.

## Implementation steps

### 1. `frontend/components/ui/Toast.tsx`
```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastAPI {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
  warning: (msg: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

let uid = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++uid;
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const api: ToastAPI = {
    success: (m) => push("success", m),
    error:   (m) => push("error",   m),
    info:    (m) => push("info",    m),
    warning: (m) => push("warning", m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence>
          {items.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={() => setItems((p) => p.filter((x) => x.id !== t.id))} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const palette: Record<ToastKind, { icon: ReactNode; ring: string; bar: string }> = {
    success: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-300" />, ring: "border-emerald-500/40", bar: "bg-emerald-400" },
    error:   { icon: <AlertCircle  className="w-5 h-5 text-rose-300" />,   ring: "border-rose-500/40",   bar: "bg-rose-400" },
    info:    { icon: <Info         className="w-5 h-5 text-sky-300" />,   ring: "border-sky-500/40",    bar: "bg-sky-400" },
    warning: { icon: <AlertTriangle className="w-5 h-5 text-amber-300" />,ring: "border-amber-500/40",  bar: "bg-amber-400" },
  };
  const p = palette[item.kind];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn(
        "pointer-events-auto relative w-80 rounded-lg border bg-bg-raised/95 backdrop-blur-xl px-4 py-3 shadow-md",
        p.ring
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{p.icon}</div>
        <p className="flex-1 text-sm text-gray-100 leading-snug">{item.message}</p>
        <button aria-label="Dismiss" onClick={onDismiss} className="text-gray-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: 0 }}
        transition={{ duration: 4.2, ease: "linear" }}
        className={cn("absolute left-0 bottom-0 h-0.5 rounded-b-lg", p.bar)}
      />
    </motion.div>
  );
}

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
```

### 2. Wrap children in `frontend/app/layout.tsx`
Import and wrap inside `<WalletProvider>`:
```tsx
import { ToastProvider } from "@/components/ui/Toast";
// ...
<WalletProvider>
  <ToastProvider>
    <Navbar />
    <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
  </ToastProvider>
</WalletProvider>
```

### 3. Replace inline error banners
In each of `dashboard/page.tsx`, `add-product/page.tsx`, `verify/page.tsx`, and `WalletConnect.tsx`:

- **Delete** the JSX blocks like:
  ```tsx
  {error && (
    <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
      {error}
    </div>
  )}
  ```
- **Delete** the `const [error, setError] = useState("")` state and every `setError(...)` call.
- Import and use the hook:
  ```tsx
  import { useToast } from "@/components/ui/Toast";
  const toast = useToast();
  ```
- Everywhere you used to `setError(msg)`, call `toast.error(msg)` instead. Likewise `toast.success(...)` at natural success points (e.g. after a product is added in add-product, show `toast.success("Product #${productId} added on-chain")` before the redirect).

## Acceptance checks
- [ ] Any failure in connecting the wallet, adding a product, or verifying a product shows a sliding toast in the top-right — NOT a red banner embedded in the page.
- [ ] Toasts auto-dismiss after ~4 seconds with a thin coloured progress bar.
- [ ] The × button dismisses a toast immediately.
- [ ] Success toasts appear after: successful product add, successful registration.
- [ ] Multiple toasts stack vertically without overlapping.

## STOP — request user review
After finishing, post exactly: `Phase 06 complete — requesting review.`
