# Phase 19 — Documentation rewrite (code figures + Part-1 parity)

## Goal
Rewrite `documentation/documentation_group13.md` into a marker-facing report: a cover page with the Group 13 members, a Part-1 ↔ Part-2 mapping table, an architecture diagram that reproduces Part 1 Figure 1, and a feature walkthrough where every feature is backed by one or more **Figure X.Y code snippets** lifted verbatim from the current source tree and captioned with file path + line range.

## Files in scope (ALLOWED to create/edit)
- `documentation/documentation_group13.md` (rewrite)

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
   Example:
   ```
   **Figure 2.1 — addProduct on-chain function** — *Source: `hardhat-project/contracts/SupplyChain.sol` lines 84–102.*
   ```
3. If a file's line numbers change between the existing codebase and the post-enhancement codebase, use the **current** line numbers at the time this phase runs.
4. Use Mermaid for the architecture diagram (GitHub renders it).
5. Carry the six references from Part 1 §8 into a References section.

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
```

### 3. Executive Summary (≈ half a page)

Explain in plain prose: what the DApp is, which Part 1 problems it solves, what changed in Part 2 beyond the original mock-up (IPFS, QR, audit filters, premium UI).

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

Copy the existing setup section in full. Add the IPFS step (`ipfs init` + `ipfs daemon`) added by Phase 15. Add a short "Fill `.env.local`" note referencing the new `.env.local.example`.

### 8. Feature walkthrough with code figures

For each feature below, include: a short prose description (2–4 sentences), the required figures (each a code block quoted verbatim from the current source + captioned).

#### Feature 1 — Add Product (on-chain)
- **Figure 2.1** — `addProduct` Solidity function from `hardhat-project/contracts/SupplyChain.sol`.
- **Figure 2.2** — `ProductAdded` event parsing inside `frontend/app/add-product/page.tsx`.
- **Figure 2.3** — DB metadata save inside `frontend/app/add-product/page.tsx`.

#### Feature 2 — Wallet + Role Registration
- **Figure 3.1** — `connectWallet` helper from `frontend/lib/contract.ts`.
- **Figure 3.2** — Role-aware nav rendering from `frontend/components/Navbar.tsx`.

#### Feature 3 — Transfer Ownership + Status Update
- **Figure 4.1** — `transferOwnership` Solidity from `SupplyChain.sol`.
- **Figure 4.2** — `updateStatus` Solidity with the sequential-transition check from `SupplyChain.sol`.

#### Feature 4 — Verify Product (public, no wallet)
- **Figure 5.1** — Read-only provider in `frontend/lib/contract.ts`.
- **Figure 5.2** — `verifyProduct` Solidity from `SupplyChain.sol`.
- **Figure 5.3** — Verify handler in `frontend/app/verify/page.tsx`.

#### Feature 5 — Certification anchoring via IPFS (Phase 15)
- **Figure 6.1** — `uploadToIPFS` helper from `frontend/lib/ipfs.ts`.
- **Figure 6.2** — `addCertificationHash` Solidity from `SupplyChain.sol`.
- **Figure 6.3** — Call site in `frontend/app/add-product/page.tsx` that uploads then anchors.

#### Feature 6 — Track timeline and QR (Phase 12 + 16)
- **Figure 7.1** — `getHistory` Solidity from `SupplyChain.sol`.
- **Figure 7.2** — `HistoryTimeline` render from `frontend/app/track/[id]/_components/HistoryTimeline.tsx`.
- **Figure 7.3** — `ProductQR` component from `frontend/components/ProductQR.tsx`.

#### Feature 7 — API layer + MySQL
- **Figure 8.1** — POST handler from `frontend/app/api/products/route.ts`.
- **Figure 8.2** — Connection pool from `frontend/lib/db.ts`.

#### Feature 8 — Auditor dashboard with filters (Phase 17)
- **Figure 9.1** — `FilterBar` component from `frontend/app/audit/_components/FilterBar.tsx`.
- **Figure 9.2** — Filter composition (AND) in `frontend/app/audit/page.tsx`.

### 9. Smart Contract Reference
Carry over / re-use the existing tables (functions, events, roles, status transitions).

### 10. API Reference
Carry over the existing endpoint table.

### 11. Architecture Decisions
Carry over the existing decisions. Add two new entries:
- **IPFS CID anchored on-chain** — the SHA-256 approach in the initial implementation was replaced by a true IPFS CID (v1 `bafy…`), matching Part 1 §4.5.
- **Filter state in URL** — the audit filters live in the URL search params so a filter view is shareable.

### 12. Testing
- **Figure 10.1** — A representative test from `hardhat-project/test/SupplyChain.test.ts`. Pick one test case that exercises access control (`onlyRole`).
- Add a note: "29 tests pass; re-run with `cd hardhat-project && npx hardhat test`."

### 13. Screenshots

A list of placeholders the group will fill in before submission:
```md
### Screenshots
- `[INSERT SCREENSHOT — Dashboard]`
- `[INSERT SCREENSHOT — Add Product, step 3 review]`
- `[INSERT SCREENSHOT — Add Product, success screen with confetti + QR]`
- `[INSERT SCREENSHOT — Track page with timeline + status progress bar + QR]`
- `[INSERT SCREENSHOT — Verify page with authenticity seal]`
- `[INSERT SCREENSHOT — Verify page with QR scanner open, Upload tab]`
- `[INSERT SCREENSHOT — IPFS gateway showing the actual certificate file]`
- `[INSERT SCREENSHOT — Audit page with filters applied + donut chart]`
```

### 14. References

Reproduce the six references from Part 1 §8 (IBM, Institute for Supply Management, Global Market Insights, OECD/EUIPO 2025, OECD 2020, WHO 2024). Use the same wording.

## Acceptance checks
- [ ] `documentation/documentation_group13.md` opens with the Group 13 member table.
- [ ] A Part 1 ↔ Part 2 mapping table is present before the Executive Summary.
- [ ] Figure 1 is a Mermaid diagram with four layers matching Part 1 §5.2.
- [ ] Every Figure X.Y code block is quoted verbatim from the current source and captioned with a `*Source: ... lines A–B.*` line.
- [ ] All six Part 1 references appear under References.
- [ ] Screenshots section contains the eight placeholders.

## STOP — request user review
After finishing, post exactly: `Phase 19 complete — requesting review.`
