# Phase 18 — Accessibility & motion polish

## Goal
Finalise accessibility: every interactive element has a visible focus ring, every icon-only button has an `aria-label`, and `prefers-reduced-motion` is honoured globally. Make the app pass a basic keyboard-only run-through.

## Files in scope (ALLOWED to create/edit)
- `frontend/app/globals.css`
- `frontend/components/ui/Button.tsx`
- `frontend/components/ui/Modal.tsx`
- `frontend/components/Navbar.tsx`
- `frontend/components/WalletConnect.tsx`
- `frontend/components/ProductCard.tsx`
- `frontend/components/ProductQR.tsx` (wrap canvas with role/aria)
- `frontend/components/QRScanner.tsx`
- Any page where an icon-only button is missing a label.

## Files OUT of scope
- Contract, API routes.

## Dependencies
None new.

## Implementation steps

### 1. Strengthen the reduced-motion rule in `frontend/app/globals.css`
Append to the bottom:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
  body::before { animation: none !important; }
}
```

### 2. Audit focus rings

Every custom button/link/input/select that was introduced in earlier phases already includes `focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base`. Sweep the files in "Files in scope" and **add** that class to any interactive element missing it. In particular:

- The nav `<Link>` elements in `Navbar.tsx` (add to the className).
- The Disconnect / Connect buttons that were refactored in Phase 09 — already use `<Button>`, so fine; double-check the role pill is not tab-focusable (it shouldn't be).
- The ProductCard outer `<Link>` wrapping the whole card — add `focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:rounded-xl`.
- The QR scanner tab buttons — add focus ring.

### 3. ARIA labels

Add `aria-label` to every icon-only button in the codebase. Grep the frontend for `<button` tags whose children are only a lucide icon, and add a label:

- Navbar mobile hamburger: `aria-label={mobileOpen ? "Close menu" : "Open menu"}` (already added in Phase 02).
- Modal close button: `aria-label="Close"` (already added).
- Toast dismiss: `aria-label="Dismiss"` (already added).
- Any `<Button icon={<Download />}>Export CSV</Button>` does NOT need aria-label because it also has text; leave alone.

### 4. Semantic roles

- `Toast` region has `aria-live="polite"` (already added in Phase 06) — verify.
- Modal has `role="dialog" aria-modal="true" aria-label={title}` (already added in Phase 05) — verify.
- Audit table already uses `<table>/<thead>/<tbody>`.

### 5. Keyboard run-through script (documented in phase-19 docs too)

Document this check in the acceptance list:

1. From a fresh page load, press Tab. The first focusable element must be the skip-to-content or the logo, then the nav links in order, then the wallet connect button.
2. Pressing Enter on any nav link navigates.
3. Tab into the main content; every input and button receives a visible indigo focus ring.
4. Open the register modal (by connecting a new account). Tab should cycle only within the modal; Escape should close it; Shift+Tab from the first field should loop to the last focusable element in the modal.

## Acceptance checks
- [ ] Setting the OS to "Reduce motion" makes the grid background, button hover lift, modal enter, timeline draw, toast slide, and card stagger all collapse to nothing / opacity-only fades.
- [ ] Every button and link shows a visible focus ring when reached via Tab.
- [ ] Every icon-only button has an `aria-label` (screen reader announces meaningful name).
- [ ] Modal focus trap works: Tab cannot leave the open modal.

## STOP — request user review
After finishing, post exactly: `Phase 18 complete — requesting review.`
