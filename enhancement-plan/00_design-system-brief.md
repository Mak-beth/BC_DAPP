# 00 — Design System Brief (read-only reference)

This file is not a task. It is the **visual language** every subsequent phase refers back to. When a phase says "use the primary gradient" or "use the glass surface", the exact value comes from here.

---

## Visual direction

- **Base:** dark slate. Background `#0B0F1A`. All pages sit on a subtle moving grid with a faint noise overlay.
- **Accent:** electric-indigo → cyan gradient. `from-indigo-500 via-sky-500 to-cyan-400`.
- **Surface:** glass cards. `bg-white/[0.03]` + `backdrop-blur-xl` + `border border-white/10` + an inset 1px highlight.
- **Danger:** `text-rose-400` / `bg-rose-500/10`.
- **Success:** `text-emerald-400` / `bg-emerald-500/10`.
- **Warning:** `text-amber-400` / `bg-amber-500/10`.

---

## Colour tokens (added in Phase 01 to `tailwind.config.ts`)

```ts
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
}
```

---

## Typography

- **UI:** `Inter` variable (`next/font/google`), weights 400/500/600/700.
- **Mono (addresses, CIDs, hashes):** `JetBrains Mono`, weights 400/500.

Addresses and CIDs **always** use the mono font.

---

## Motion tokens

- Durations: `fast 120ms`, `base 220ms`, `slow 420ms`.
- Enter easing: `[0.16, 1, 0.3, 1]` (ease-out).
- Exit easing: `[0.4, 0, 0.68, 0.06]` (ease-in).
- Spring for cards/modals: `{ type: 'spring', stiffness: 260, damping: 24 }`.
- Stagger children: `{ staggerChildren: 0.05 }`.

---

## Radius & elevation

- `rounded-md` 8px, `rounded-lg` 12px, `rounded-xl` 16px, `rounded-2xl` 24px.
- Shadow tokens (in Tailwind config):
  - `shadow.sm` — `0 1px 2px rgba(0,0,0,0.4)`
  - `shadow.md` — `0 4px 24px rgba(0,0,0,0.4)`
  - `shadow.glow` — `0 0 32px rgba(99, 102, 241, 0.35)` (hover / focus)

---

## Glass surface recipe

```tsx
<div className="relative rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-md">
  {/* inner highlight */}
  <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/5" />
  <div className="relative p-5">{children}</div>
</div>
```

---

## Accessibility floor

- Every interactive element has a `focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base`.
- All motion respects `prefers-reduced-motion` — Phase 18 enforces this globally.
- Contrast: AA minimum. Text on glass surfaces must use `text-gray-100` or `text-gray-300`, never lower.
- Icon-only buttons always carry `aria-label`.
