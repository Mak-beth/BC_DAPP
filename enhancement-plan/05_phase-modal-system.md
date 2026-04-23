# Phase 05 — Modal primitive

## Goal
Introduce a reusable `<Modal>` built on framer-motion with backdrop blur, ESC-to-close, click-outside-to-close, and focus trap. Refactor the wallet registration modal (the one that appears when a new address connects) to use it. The modal should enter with a subtle scale+fade; exit with a fade.

## Files in scope (ALLOWED to create/edit)
- `frontend/components/ui/Modal.tsx` (new)
- `frontend/components/WalletConnect.tsx`

## Files OUT of scope
- Everything else.

## Dependencies
Install focus-trap:
```bash
npm install focus-trap-react
```

## Implementation steps

### 1. `frontend/components/ui/Modal.tsx`
```tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FocusTrap from "focus-trap-react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <FocusTrap focusTrapOptions={{ escapeDeactivates: false, allowOutsideClick: true }}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className={`relative w-full ${maxWidth} rounded-2xl border border-border-strong bg-bg-raised/95 backdrop-blur-xl shadow-md p-6`}
            >
              <button
                aria-label="Close"
                onClick={onClose}
                className="absolute top-3 right-3 grid place-items-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              {title && <h2 className="text-xl font-bold text-white mb-4 pr-8">{title}</h2>}
              {children}
            </motion.div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}
```

### 2. Refactor `frontend/components/WalletConnect.tsx`
Import the new modal:
```tsx
import { Modal } from "@/components/ui/Modal";
```

Replace the entire registration modal JSX block (the `{modalState === "visible" && ( <div className="fixed inset-0 bg-black/70 ..."> ... </div> )}` section) with:

```tsx
<Modal
  open={modalState === "visible"}
  onClose={() => { setModalState("hidden"); setConnectState("idle"); }}
  title="Register User"
>
  <p className="text-sm text-gray-400 mb-5 font-mono break-all">{pendingAddress}</p>
  <form onSubmit={handleRegisterSubmit} className="space-y-4">
    <div>
      <Label>Company Name</Label>
      <Input
        required
        value={form.companyName}
        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
      />
    </div>
    <div>
      <Label>Role</Label>
      <Select
        value={form.role}
        onChange={(e) =>
          setForm({ ...form, role: e.target.value as Exclude<UserRole, "NONE"> })
        }
      >
        <option value="MANUFACTURER">Manufacturer</option>
        <option value="DISTRIBUTOR">Distributor</option>
        <option value="RETAILER">Retailer</option>
      </Select>
    </div>
    {error && <div className="text-rose-400 text-sm">{error}</div>}
    <div className="flex justify-end gap-3 pt-2">
      <Button
        type="button"
        variant="ghost"
        onClick={() => { setModalState("hidden"); setConnectState("idle"); }}
      >
        Cancel
      </Button>
      <Button type="submit">Register</Button>
    </div>
  </form>
</Modal>
```

Remember to import `Label`, `Input`, `Select`, and `Button` from the previous phases.

## Acceptance checks
- [ ] Connecting a brand-new MetaMask account opens the register modal with a scale+fade animation.
- [ ] Pressing `Escape` closes the modal.
- [ ] Clicking the backdrop closes the modal.
- [ ] Tab key cycles focus **only within the modal** (focus trap).
- [ ] Body scroll is locked while the modal is open.
- [ ] Modal close "×" button in the top-right works and is keyboard-focusable.

## STOP — request user review
After finishing, post exactly: `Phase 05 complete — requesting review.`
