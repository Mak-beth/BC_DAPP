# Enhancement Plan — Supply Chain DApp, Group 13

CT124-3-3-BCD Blockchain Development · Part 2 enhancement pack.

This folder is a **sequential execution plan** for an AI coder. Each numbered file is a self-contained task. Hand them over **one at a time**. Do not let the coder read ahead.

---

## How to use this folder

1. Open `01_phase-foundation.md`. Copy its **entire contents** and paste it into the AI coder as the sole instruction.
2. Wait for the coder to reply: *"Phase 01 complete — requesting review."*
3. Start the frontend (`cd frontend && npm run dev`) and run through the **Acceptance checks** at the bottom of that phase file.
4. If everything passes, open `02_phase-navbar.md` and repeat.
5. If something is wrong, tell the coder what's wrong and have them fix it **within the same phase** — do not move on.

**Never** give the coder more than one phase file at once. Never skip a phase. Never let the coder modify files outside the "Files in scope" list of the current phase.

---

## Phase order

| # | File | Summary | Proposal parity? |
|---|---|---|---|
| 00 | `00_design-system-brief.md` | Read-only reference: visual/motion tokens | — |
| 01 | `01_phase-foundation.md` | Install libs, Tailwind tokens, global CSS, fonts, background | |
| 02 | `02_phase-navbar.md` | Glass navbar, animated active pill, mobile drawer | |
| 03 | `03_phase-buttons.md` | Reusable Button component | |
| 04 | `04_phase-inputs-forms.md` | Inputs, Textarea, Select, FileDropzone | |
| 05 | `05_phase-modal-system.md` | Modal primitive with AnimatePresence + focus trap | |
| 06 | `06_phase-toast-notifications.md` | Toast portal; remove inline red banners | |
| 07 | `07_phase-product-card.md` | Gradient border hover, tilt, shimmer skeleton | |
| 08 | `08_phase-dashboard.md` | Hero greeting, stat tiles, search, empty state | |
| 09 | `09_phase-wallet-connect.md` | Role glow, network-mismatch banner | |
| 10 | `10_phase-add-product.md` | 3-step wizard, confetti, success QR | |
| 11 | `11_phase-verify.md` | Scanner hero, authenticity seal reveal | |
| 12 | `12_phase-track-timeline.md` | Animated timeline, status progress bar | |
| 13 | `13_phase-audit.md` | Sortable table, donut chart, CSV export | |
| 14 | `14_phase-loading-transitions.md` | Skeletons, route transition, top progress bar | |
| 15 | `15_phase-ipfs-integration.md` | **IPFS upload + on-chain CID** | ✅ |
| 16 | `16_phase-qr-code.md` | **QR generate; scan via upload + camera** | ✅ |
| 17 | `17_phase-audit-filters.md` | **Product / batch / date-range filters** | ✅ |
| 18 | `18_phase-a11y-polish.md` | Reduced-motion, focus rings, ARIA | |
| 19 | `19_phase-documentation.md` | Rewrite `documentation_group13.md` w/ Figure X.Y | |
| 20 | `20_phase-presentation-readme.md` | Plain-language `PRESENTATION.md` for demo | |

Phases 15, 16, 17 are marked "proposal parity" — they exist because Part 1 promised these features. Do not skip them.

---

## The prompt to paste with each phase file

When you hand a phase to the coder, prefix it with this one-line instruction:

> Read the phase file below. Implement **only** what it says. Do not edit files outside "Files in scope". When done, reply exactly with `"Phase NN complete — requesting review."` and nothing else.

---

## Tech context (for the coder, same every phase)

- **Project root:** `c:\Users\tahaf\Desktop\UNI\Blockchain Development\`
- **Frontend root:** `frontend/` — Next.js 14 App Router + TypeScript + Tailwind CSS + ethers v6 + MySQL (`mysql2`).
- **Contract:** `hardhat-project/contracts/SupplyChain.sol` is **frozen**. Do not modify it in any UI phase. Phase 15 interacts with it through the existing `addCertificationHash` signature.
- **Chain:** local Hardhat node, chain ID `31337`, RPC `http://127.0.0.1:8545`.
- **Wallet:** MetaMask. Account #0 from `npx hardhat node` holds the MANUFACTURER role after `scripts/assignRole.ts` runs.

---

## Group 13

| Name | TP Number |
|---|---|
| NOOR KHALIL ABDULLAH KHALED | TP078880 |
| TAHA FAHD AHMED MOHAMMED THABIT | TP078281 |
| ABUBAKER ELSIDDIG TAGELDEEN SIDDIG | TP078003 |
| MUHMMAD AHMED KHAN | TP069769 |
