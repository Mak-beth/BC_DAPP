# Phase 19 — Documentation rewrite (code figures + Part-1 parity)

## Goal
Rewrite `documentation/documentation_group13.md` into a marker-facing report: a cover page with Group 13 members, a Part-1 ↔ Part-2 mapping table, an architecture diagram that reproduces Part 1 Figure 1, and a feature walkthrough where every feature is backed by one or more **Figure X.Y code snippets** lifted verbatim from the current source tree and captioned with file path + line range. The report must justify every design decision by citing the Part 1 section it satisfies and the marking rubric criterion it addresses.

## Files in scope (ALLOWED to create/edit)
- `documentation/documentation_group13.md` (rewrite)

> **Format note:** The output file MUST be `.md` (Markdown). Do NOT produce a Word document (.docx). The file is rendered in GitHub and submitted as-is.

## Files OUT of scope
- Everything else. This is a docs-only phase.

## Dependencies
None.

## Ground rules for the AI coder

1. **Every code block in a "Figure X.Y" must be quoted verbatim from the current source file.** Do not paraphrase, shorten, or invent. Read the file first, then paste.
2. Every code block is immediately followed by a caption line in this exact format:
   ```
   **Figure X.Y — <short description>** — *Source: `<relative path>` lines A–B.*
   ```
3. If a file's line numbers change between the existing codebase and the post-enhancement codebase, use the **current** line numbers at the time this phase runs.
4. Use Mermaid for the architecture diagram (GitHub renders it).
5. Carry the six references from Part 1 §8 into a References section.
6. **Every feature section must open** with a sentence in this form: *"This feature implements [Part 1 §X.Y] and satisfies the marking criterion [criterion name] by..."* This is the single most important justification signal the examiner will see.

## Structure (in this order)

### 1. Cover
```md
# Supply Chain DApp — Part 2 Implementation
**CT124-3-3-BCD Blockchain Development · Group 13**

| Name | TP Number |
|---|---|
| NOOR KHALIL ABDULLAH KHALED | TP078880 |
| TAHA FAHD AHMED MOHAMMED THABIT | TP078281 |
| ABUBAKER ELSIDDIG TAGELDEEN SIDDIG | TP078003 |
| MUHMMAD AHMED KHAN | TP069769 |
```

### 2. Part 1 ↔ Part 2 Mapping

This table must appear **before** the Executive Summary. It lets the examiner match every Part 1 promise to its Part 2 implementation in under 30 seconds.

```md
## Part 1 ↔ Part 2 feature mapping

| Part 1 section | Promised feature | Part 2 evidence |
|---|---|---|
| §4.3 Hybrid data | On-chain + IPFS | §Architecture + Figure 1; Figures 6.1–6.3 |
| §4.5 Data table | IPFS CID on-chain | Figure 6.1 (`uploadToIPFS`), Figure 6.2 (`addCertificationHash`) |
| §5.2.1 | Product QR code | Figure 7.3 (`ProductQR`), screenshot §Screenshots |
| §5.2.1 | Audit dashboard w/ filters | Figures 9.1–9.2, screenshot §Screenshots |
| §5.3 | addProduct / transferOwnership / addCertificationHash / verifyProduct | Figures 2.1, 4.1, 6.2, 5.2 |
| §5.2.1 | MetaMask role-gated auth | Figures 3.1, 3.2 |
| §5.3 transferOwnership | Transfer ownership via UI (one-click, ContactPicker) | Figures 11.1, 11.2, 11.3 |
| §3.2 Professional quality | Three-theme design system (Nebula / Aurora / Obsidian) | Figures 15.1, 15.2, 15.3, 15.4 |
| §5.4 IoT integration | Real-time sensor data logging on-chain + live chart | Figures 13.1, 13.2, 13.3 |
| §5.3 Product safety | On-chain product recall system with UI issue/lift flow | Figures 14.1, 14.2, 14.3 |
```

### 3. Executive Summary (≈ half a page)

Explain in plain prose: what the DApp is, which Part 1 problems it solves, what changed in Part 2 beyond the original mock-up (IPFS, QR, audit filters, premium UI, address book, theme system). Explicitly state: *"This report is structured so that every Part 1 promise is cross-referenced to a code figure. The Part 1 ↔ Part 2 mapping table above is the primary reference for the examiner."*

### 4. System Overview

Keep the existing System Overview prose from the pre-phase file, polished. End with a lead-in to the diagram.

### 5. Technology Stack

Reuse the existing table (Solidity / Hardhat / Next.js 14 / ethers v6 / MySQL / MetaMask / IPFS). Add a row for **IPFS: Kubo (local daemon)**.

### 6. Architecture (Figure 1)

```md
## Architecture

```mermaid
flowchart TB
    subgraph U[User Layer]
      M[Manufacturer]
      D[Distributor]
      R[Retailer]
      REG[Regulator]
      IOT[IoT Devices]
    end
    subgraph A[Application Layer]
      FE[Next.js Frontend]
      API[/api/* Routes]
      DB[(MySQL)]
    end
    subgraph B[Blockchain Layer]
      SC[SupplyChain.sol]
      HH[Hardhat Node · 31337]
    end
    subgraph S[Off-Chain Storage Layer]
      IPFS[(IPFS · Kubo)]
    end

    M --> FE
    D --> FE
    R --> FE
    REG --> FE
    IOT -. Sensor data .-> API

    FE -- read/write --> SC
    SC --- HH
    FE -- metadata --> API
    API --- DB

    FE -- upload file --> IPFS
    SC -- anchor CID --> IPFS
```

**Figure 1 — System architecture (Part-1 aligned).** *Reproduced from Part 1 Proposal §5.2 Figure 1.*
```

### 7. Setup Instructions

Copy the existing setup section in full. Add:

**IPFS step** (`ipfs init` + `ipfs daemon`), added by Phase 15.

**Users database table** — stores company name and role per wallet:
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL,
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Contacts database table** — run after `CREATE DATABASE supplychain;`:
```sql
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_wallet VARCHAR(42) NOT NULL,
  contact_address VARCHAR(42) NOT NULL,
  name VARCHAR(120),
  role ENUM('MANUFACTURER','DISTRIBUTOR','RETAILER','REGULATOR') DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_owner_contact (owner_wallet, contact_address)
);
```

Add a short "Fill `.env.local`" note referencing the new `.env.local.example`.

### 8. Feature walkthrough with code figures

**Justification rule:** Every feature section MUST open with a sentence linking it to Part 1 and/or the marking rubric. Use this pattern:
> *"This feature implements [Part 1 §X.Y / marking criterion Y] by [one-line technical summary]."*

For each feature below, include: a short prose description (2–4 sentences) plus the required figures (each a code block quoted verbatim from the current source + captioned).

#### Feature 1 — Add Product (on-chain)

*Justification opener:* "This feature implements the `addProduct(productID, batchNumber)` function committed to in Part 1 §5.3 and satisfies the 'complete implementation of proposed smart-contract functions' marking criterion by writing each new product to the blockchain with a unique on-chain ID, emitting a `ProductAdded` event that the frontend parses to confirm registration."

- **Figure 2.1** — `addProduct` Solidity function from `hardhat-project/contracts/SupplyChain.sol`.
- **Figure 2.2** — `ProductAdded` event parsing inside `frontend/app/add-product/page.tsx`.
- **Figure 2.3** — DB metadata save inside `frontend/app/add-product/page.tsx`.

#### Feature 2 — Wallet + Role Registration

*Justification opener:* "This feature implements the MetaMask role-gated authentication described in Part 1 §5.2.1 by reading the connected wallet's role from the smart contract on every page load and passing it through React context so every component can gate writes without redundant RPC calls. Company name is collected at registration, stored in MySQL, and displayed as the dashboard heading so the examiner can see the full identity of each role participant."

- **Figure 3.1** — `connectWallet` helper from `frontend/lib/contract.ts`.
- **Figure 3.2** — Role-aware nav rendering from `frontend/components/Navbar.tsx`.
- **Figure 3.3** — `WalletConnect` registration form (company name + role) from `frontend/components/WalletConnect.tsx`.

#### Feature 3 — Transfer Ownership + Status Update

*Justification opener:* "This feature implements `transferOwnership(productID, newOwner)` and `updateStatus(productID, newStatus)` from Part 1 §5.3. The `updateStatus` function includes a sequential-transition guard on-chain — status can only advance one step at a time — which matches the lifecycle diagram in Part 1 §5.2."

- **Figure 4.1** — `transferOwnership` Solidity from `SupplyChain.sol`.
- **Figure 4.2** — `updateStatus` Solidity with the sequential-transition check from `SupplyChain.sol`.

#### Feature 4 — Verify Product (public, no wallet)

*Justification opener:* "This feature implements `verifyProduct(productID)` from Part 1 §5.3 as a read-only, wallet-free public page — satisfying the proposal's requirement that any consumer can verify product authenticity without holding an Ethereum account."

- **Figure 5.1** — Read-only provider in `frontend/lib/contract.ts`.
- **Figure 5.2** — `verifyProduct` Solidity from `SupplyChain.sol`.
- **Figure 5.3** — Verify handler in `frontend/app/verify/page.tsx`.

#### Feature 5 — Certification anchoring via IPFS (Phase 15)

*Justification opener:* "This feature closes the largest gap between Part 1 and Part 2: Part 1 §4.3 and §4.5 promised hybrid on-chain / off-chain storage with IPFS for certificates, with the CID anchored on-chain. Phase 15 replaces the earlier SHA-256 filesystem approach with a real IPFS upload, and the returned `bafy…` CID is passed to `addCertificationHash` — matching the exact data-table design in Part 1 §4.5."

- **Figure 6.1** — `uploadToIPFS` helper from `frontend/lib/ipfs.ts`.
- **Figure 6.2** — `addCertificationHash` Solidity from `SupplyChain.sol`.
- **Figure 6.3** — Call site in `frontend/app/add-product/page.tsx` that uploads then anchors.

#### Feature 6 — Track timeline and QR (Phase 12 + 16)

*Justification opener:* "This feature implements the product provenance history view and the QR code promised in Part 1 §5.2.1. The QR encodes `/verify?id=<n>` so any retailer or consumer can scan the physical packaging and reach the public verification page directly."

- **Figure 7.1** — `getHistory` Solidity from `SupplyChain.sol`.
- **Figure 7.2** — `HistoryTimeline` render from `frontend/app/track/[id]/_components/HistoryTimeline.tsx`.
- **Figure 7.3** — `ProductQR` component from `frontend/components/ProductQR.tsx`.

#### Feature 7 — API layer + MySQL

*Justification opener:* "The MySQL layer exists to satisfy Part 1 §4.3 hybrid architecture: fast UI queries ('show my products') that would be too slow or costly to serve from the blockchain RPC. The blockchain remains the source of truth for ownership and status; MySQL stores display metadata only."

- **Figure 8.1** — POST handler from `frontend/app/api/products/route.ts`.
- **Figure 8.2** — Connection pool from `frontend/lib/db.ts`.

#### Feature 8 — Auditor dashboard with filters (Phase 17)

*Justification opener:* "This feature implements the audit dashboard with product / batch / date-range filters committed to in Part 1 §5.2.1. Filter state is synced to the URL via `useSearchParams` so a regulator can bookmark or share a filtered view — a detail that demonstrates production-quality engineering beyond the minimum requirement."

- **Figure 9.1** — `FilterBar` component from `frontend/app/audit/_components/FilterBar.tsx`.
- **Figure 9.2** — Filter composition (AND) in `frontend/app/audit/page.tsx`.

#### Feature 9 — Contacts address book + Transfer Ownership UI (Phase 21)

*Justification opener:* "Phase 21 surfaces `transferOwnership(productID, newOwner)` from Part 1 §5.3 as a one-click UI action on every product card and track page. A contacts address book eliminates manual entry of 42-character hex addresses — a UX decision that directly satisfies the 'complete and usable implementation' marking criterion; a function that exists only at the console level is not a complete implementation."

Prose: The contacts table (MySQL) stores owner-wallet → contact-address mappings with an optional name and role label. The `ContactPicker` component offers two tabs: pick from saved contacts, or enter a new address with a "Save to contacts" checkbox. `TransferOwnershipModal` calls `contract.transferOwnership(id, address)` and saves the new contact if the checkbox is checked. `UpdateStatusModal` advances the product status one step and shows a terminal-state message when SOLD.

- **Figure 11.1** — `ContactPicker` two-tab combobox from `frontend/components/ContactPicker.tsx`.
- **Figure 11.2** — `TransferOwnershipModal` contract call site from `frontend/components/TransferOwnershipModal.tsx`.
- **Figure 11.3** — `/api/contacts` POST handler (upsert) from `frontend/app/api/contacts/route.ts`.
- **Figure 11.4** — `UpdateStatusModal` sequential-advance logic from `frontend/components/UpdateStatusModal.tsx`.

#### Feature 11 — IoT Sensor Simulation (Phase 23)

*Justification opener:* "This feature implements the IoT sensor integration described in Part 1 §5.4 by adding an on-chain `logSensorReading` function that stores temperature, humidity, and location readings keyed by product ID, and exposing them as a live chart on the track page — closing the gap between the Part 1 proposal and Part 2 delivery."

Prose: A dedicated `/iot-simulator` page lets any DISTRIBUTOR or RETAILER wallet submit sensor readings (temperature °C, humidity %, location string) for any product. Readings are stored on-chain in a `SensorEntry` struct array via `getSensorReadings`. The track page fetches all readings and renders them in a `SensorChart` component (recharts line chart, temperature on the primary axis, humidity on the secondary).

- **Figure 13.1** — `logSensorReading` Solidity function from `hardhat-project/contracts/SupplyChain.sol`.
- **Figure 13.2** — `getSensorReadings` Solidity view function from `hardhat-project/contracts/SupplyChain.sol`.
- **Figure 13.3** — `SensorChart` component from `frontend/components/SensorChart.tsx`.

#### Feature 12 — Product Recall System (Phase 24)

*Justification opener:* "This feature implements the product safety management requirement implicit in Part 1 §5.3 and satisfies the 'complete implementation of proposed smart-contract functions' marking criterion by giving the MANUFACTURER role the ability to issue and lift product recalls on-chain, with recall status surfaced as a red banner on every public-facing product page."

Prose: The contract stores a `RecallEntry` struct (`active`, `reason`, `issuedBy`, `timestamp`) per product in a `recalls` mapping. `issueRecall` and `liftRecall` are gated to `onlyRole(MANUFACTURER)` and append entries to the product history. The frontend surfaces recall status via three touch points: a `RecallBanner` animated alert on the verify and track pages, a RECALLED badge on every `ProductCard`, and an `IssueRecallModal` on the dashboard and track page that lets the manufacturer issue or lift a recall in one click.

- **Figure 14.1** — `issueRecall` and `liftRecall` Solidity functions from `hardhat-project/contracts/SupplyChain.sol`.
- **Figure 14.2** — `RecallBanner` component from `frontend/components/RecallBanner.tsx`.
- **Figure 14.3** — `IssueRecallModal` contract call site from `frontend/components/IssueRecallModal.tsx`.

#### Feature 13 — Three-theme design system (Phase 22)

*Justification opener:* "Phase 22 addresses the A+ marking criterion 'outstanding quality; complete in every way' (80–100%) by replacing the generic indigo/cyan hardcoded Tailwind classes with a CSS custom-property system. Three named themes — Nebula (violet/indigo/cyan, default), Aurora (mint/sky/violet), Obsidian (monochrome/bronze) — demonstrate that the colour architecture is correct: adding a fourth theme requires only one CSS block, not edits to every component."

Prose: All components consume `--sig-1`, `--sig-2`, `--sig-3` (signature gradient stops), `--role-mfr`, `--role-dst`, `--role-ret`, and `--verified`. The `ThemeProvider` reads localStorage on mount, applies `theme-aurora` or `theme-obsidian` as a class on `<html>`, and exposes `setTheme` via React context. `AuroraBackground` renders three drifting radial-gradient blobs with a vignette and film-grain noise overlay — the visual signature of the Nebula theme.

- **Figure 15.1** — `ThemeProvider`/`useTheme` from `frontend/lib/theme.tsx`.
- **Figure 15.2** — `AuroraBackground` drifting blob animation from `frontend/components/AuroraBackground.tsx`.
- **Figure 15.3** — `ThemeSwitcher` palette tiles from `frontend/components/ThemeSwitcher.tsx`.
- **Figure 15.4** — CSS variable block (`:root`, `.theme-aurora`, `.theme-obsidian`) from `frontend/app/globals.css`.

### 9. Smart Contract Reference
Carry over / re-use the existing tables (functions, events, roles, status transitions).

### 10. API Reference
Carry over the existing endpoint table. Add:
- `GET /api/contacts?owner=<wallet>` — returns saved contacts for a wallet
- `POST /api/contacts` — upsert a contact (owner_wallet + contact_address unique)
- `PATCH /api/contacts/[id]` — update name/role/notes
- `DELETE /api/contacts/[id]` — remove a contact

### 11. Architecture Decisions
Carry over the existing decisions. Add four new entries:

- **IPFS CID anchored on-chain** — the SHA-256 approach in the initial implementation was replaced by a true IPFS CID (v1 `bafy…`), matching Part 1 §4.5. The CID is content-addressed: changing one byte of the file changes the CID, making tampering detectable.
- **Filter state in URL** — the audit filters live in the URL search params so a filter view is shareable and survives page reload — relevant for regulators who need reproducible investigation queries.
- **Contacts stored in MySQL, not on-chain** — Ethereum address labels are display metadata; storing them on-chain would cost gas for every create/rename. The authoritative ownership record lives in the smart contract (`products[id].currentOwner`); contacts are advisory UX data only.
- **CSS custom-property theme system** — hardcoded Tailwind colour classes (`bg-indigo-600`) cannot be changed at runtime. CSS variables (`var(--sig-1)`) let the entire palette swap by toggling one class on `<html>`, matching the pattern used by production design systems (Radix UI, shadcn/ui). This approach means future themes are added with zero component changes.

### 12. Testing
- **Figure 10.1** — A representative test from `hardhat-project/test/SupplyChain.test.ts`. Pick one test case that exercises access control (`onlyRole`).
- Add a note: "43 tests pass (29 original + 6 IoT + 8 Recall); re-run with `cd hardhat-project && npx hardhat test`."

### 13. Screenshots

```md
### Screenshots
- `[INSERT SCREENSHOT — Dashboard with role badge + stat tiles]`
- `[INSERT SCREENSHOT — Add Product, step 3 review]`
- `[INSERT SCREENSHOT — Add Product, success screen with confetti + QR]`
- `[INSERT SCREENSHOT — Track page with timeline + status progress bar + QR]`
- `[INSERT SCREENSHOT — Track page with SensorChart showing temperature and humidity readings]`
- `[INSERT SCREENSHOT — Track page with RecallBanner (red alert) visible at top]`
- `[INSERT SCREENSHOT — IssueRecallModal open, reason textarea filled]`
- `[INSERT SCREENSHOT — Verify page with authenticity seal]`
- `[INSERT SCREENSHOT — Verify page with RecallBanner for a recalled product]`
- `[INSERT SCREENSHOT — Verify page with QR scanner open, Upload tab]`
- `[INSERT SCREENSHOT — IPFS gateway showing the actual certificate file]`
- `[INSERT SCREENSHOT — Audit page with filters applied + donut chart]`
- `[INSERT SCREENSHOT — IoT Simulator page, readings submitted successfully]`
- `[INSERT SCREENSHOT — Contacts page with saved contact list and role badges]`
- `[INSERT SCREENSHOT — Transfer Ownership modal, ContactPicker showing saved contacts tab]`
- `[INSERT SCREENSHOT — ThemeSwitcher open, Aurora theme active, full dashboard]`
```

### 14. References

Reproduce the six references from Part 1 §8 (IBM, Institute for Supply Management, Global Market Insights, OECD/EUIPO 2025, OECD 2020, WHO 2024). Use the same wording.

## Acceptance checks
- [ ] `documentation/documentation_group13.md` opens with the Group 13 member table.
- [ ] A Part 1 ↔ Part 2 mapping table (12 rows minimum) is present before the Executive Summary.
- [ ] Figure 1 is a Mermaid diagram with four layers matching Part 1 §5.2.
- [ ] Every Figure X.Y code block is quoted verbatim from the current source and captioned with a `*Source: ... lines A–B.*` line.
- [ ] Every feature section opens with a justification sentence citing Part 1 or the marking rubric.
- [ ] Feature 9 (Contacts + Transfer) and Feature 13 (Theme system) are present with figures.
- [ ] Feature 11 (IoT Sensor Simulation) is present with Figures 13.1–13.3.
- [ ] Feature 12 (Product Recall System) is present with Figures 14.1–14.3.
- [ ] Contacts SQL table is in the Setup Instructions section.
- [ ] API Reference includes the four `/api/contacts` endpoints.
- [ ] Architecture Decisions includes all four new entries (IPFS CID, URL filters, Contacts in MySQL, CSS vars).
- [ ] Testing note states "43 tests pass".
- [ ] All six Part 1 references appear under References.
- [ ] Screenshots section contains at least sixteen placeholders (including IoT and Recall screens).

## STOP — request user review
After finishing, post exactly: `Phase 19 complete — requesting review.`
