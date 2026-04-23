# Phase 20 — Presentation README (`PRESENTATION.md`)

## Goal
Produce a single plain-English file at the project root — `PRESENTATION.md` — that any Group 13 member can open during the live presentation and **read aloud to the lecturer** without needing to understand the code. This is the bridge between the AI-written code and a non-technical presenter.

## Files in scope (ALLOWED to create/edit)
- `PRESENTATION.md` (new, at project root)

## Files OUT of scope
- Everything else. This is a writing-only phase.

## Dependencies
None.

## Hard rules for the AI coder

1. **Plain English.** No jargon that isn't defined inline. Assume the reader has never touched a blockchain.
2. **Short paragraphs, max 3 sentences each.**
3. **No code blocks longer than 5 lines.** If a screen needs a code reference, link to `documentation/documentation_group13.md` Figure X.Y — do not paste code.
4. **Every section must end with a line in italics** called *"What to say out loud:"* — one sentence the presenter can literally read.
5. Do not use emojis anywhere in this file.

## Required sections, in this exact order

### 1. Cover
```md
# Supply Chain DApp — Live Presentation Guide
**CT124-3-3-BCD Blockchain Development · Group 13**

Members:
- NOOR KHALIL ABDULLAH KHALED (TP078880)
- TAHA FAHD AHMED MOHAMMED THABIT (TP078281)
- ABUBAKER ELSIDDIG TAGELDEEN SIDDIG (TP078003)
- MUHMMAD AHMED KHAN (TP069769)
```

### 2. The problem in one minute

Three short paragraphs. Use these concrete figures from Part 1 §3.1: USD 467 billion in counterfeit trade globally (OECD/EUIPO 2025), 283-day average breach detection (IBM 2024), 72,000–169,000 child deaths from falsified medicines (WHO). Frame the problem as: trust broken, data siloed, fake products slipping through because no one can verify a product's full history.

*What to say out loud:* "The global supply chain loses billions every year to counterfeits, and when something goes wrong, it takes nearly a year for anyone to notice — our project closes that gap."

### 3. Our solution in one minute

Explain in plain English: we built a decentralised web app where every product's journey — who made it, who shipped it, who sold it — gets written to a blockchain. Anyone can scan a QR code on a product and see its full history. No company owns the record; the math does.

*What to say out loud:* "We built a website where every product's history is written permanently to a blockchain — and anyone can verify it with a QR code."

### 4. Who uses it

```md
| Role | What they do |
|---|---|
| Manufacturer | Registers new products, anchors certificates to IPFS |
| Distributor  | Accepts ownership, updates status to In Transit |
| Retailer     | Accepts ownership, marks products as Delivered or Sold |
| Regulator    | Reads the audit log; filters events by product, batch, or date |
| Public       | Scans a QR or enters a product ID to verify authenticity |
```

*What to say out loud:* "Four roles take part: manufacturers, distributors, retailers, regulators — plus any member of the public can verify a product with no wallet."

### 5. The demo script (6–8 minutes)

Step-by-step what to click, what to say. Cover this order:

1. **Open the dashboard** — point out the stat tiles, the role badge, the glass design. Say *"This is a manufacturer's dashboard. Notice the role badge is glowing indigo — that's how the app tells us what this wallet is allowed to do."*
2. **Add Product wizard** — walk through step 1 (fill in details), step 2 (drop a certificate PDF), step 3 (review). Click Submit. While MetaMask pops up, say *"The browser is now asking MetaMask to sign a transaction. Until I approve it here, nothing is written to the blockchain."* After confetti: *"The product is now registered on-chain. This QR code links to its public verification page."*
3. **Download the QR PNG** — right-click Save, show the file.
4. **Verify page** — click "Scan QR", stay on the **Upload** tab, drop the PNG. Show how it auto-fills and auto-verifies. Say *"I am simulating a retailer scanning a real packaging QR. The app confirms the product is authentic and shows its current owner."*
5. **Track page** — click "View Full History". Point at the timeline and status progress bar. Say *"Every handoff is a block on the timeline. This is the ledger Part 1 promised."*
6. **IPFS certificate link** — click "Local gateway"; show the PDF opens from IPFS. Say *"The certificate isn't stored in any company's database. It's on IPFS, and the hash that proves it hasn't changed is written on-chain."*
7. **Audit page** — filter by Product ID or a date range; show the donut chart changing live. Click "Export CSV".

*What to say out loud:* "We'll walk through a full product journey in under eight minutes: create, verify, track, audit."

### 6. What makes this worth high marks

A bullet list tying features to Part 1 promises:
- Hybrid on-chain / off-chain with real IPFS (Part 1 §4.3–4.5)
- QR code scan both by camera and by uploading an image (Part 1 §5.2.1)
- Audit dashboard with product / batch / date-range filters (Part 1 §5.2.1)
- Role-gated MetaMask authentication (Part 1 §5.2.1)
- Four-layer architecture that matches Part 1 Figure 1
- Premium UI with animations, skeleton loading, accessibility
- Every feature has a code figure in the documentation pack

*What to say out loud:* "Every promise in our Part 1 proposal is implemented and demonstrable on screen."

### 7. Screenshots gallery

A list of placeholders for the group to paste real screenshots into before submission:
```md
- `[SCREENSHOT: Dashboard with role badge + stat tiles]`
- `[SCREENSHOT: Add Product step 3 review]`
- `[SCREENSHOT: Success screen with confetti + QR]`
- `[SCREENSHOT: Verify with QR scanner modal, Upload tab]`
- `[SCREENSHOT: Track page full timeline]`
- `[SCREENSHOT: IPFS gateway displaying the certificate file]`
- `[SCREENSHOT: Audit page, filters active, donut chart]`
```

*What to say out loud:* "These screenshots match each step of our demo."

### 8. Architecture in plain words

Four short paragraphs — one per layer. No diagram; just link: *"See documentation/documentation_group13.md Figure 1."*

*What to say out loud:* "The app has four layers: the user's browser, the Next.js backend, the Ethereum smart contract, and IPFS for documents."

### 9. Q&A preparation

Write each as "Q: … / A: …". Include **at least 10** questions. Use these as the base set and expand:

- **Q:** What is a smart contract?
  **A:** A program stored on the blockchain that anyone can run but nobody can edit after deployment.
- **Q:** Why not deploy to Ethereum mainnet?
  **A:** For a classroom demo we use Hardhat — a free, fast local blockchain. The same Solidity contract deploys unchanged to any EVM network.
- **Q:** What happens if the IPFS node goes offline?
  **A:** The CID is already anchored on-chain. The file can be re-pinned from any IPFS node that has a copy, and the hash proves it is the original.
- **Q:** Can someone tamper with the MySQL database?
  **A:** Yes — but the database only stores display metadata. Ownership and status live on-chain, which cannot be altered.
- **Q:** How do you prevent someone granting themselves the manufacturer role?
  **A:** Role assignment is gated by `onlyOwner` on the contract. Only the contract deployer can assign roles.
- **Q:** Why pair a blockchain with MySQL at all?
  **A:** Fast queries for UI ("show my products") and optional descriptive metadata. The blockchain remains source of truth.
- **Q:** What is a CID?
  **A:** A Content Identifier — the unique fingerprint of a file on IPFS. Change one byte of the file and the CID changes completely.
- **Q:** Is the data encrypted?
  **A:** Data on-chain is public by design. Sensitive documents can be stored encrypted off-chain, but our demo keeps files open so graders can verify.
- **Q:** How many users can it handle?
  **A:** Today it runs on a single-machine demo chain. The same code runs on any EVM network that can handle the throughput needed.
- **Q:** What if two manufacturers try to create products at the same time?
  **A:** The contract assigns IDs sequentially and emits an event per add. We parse the event receipt rather than reading a counter, so concurrent submissions don't collide.
- **Q:** How is the QR code linked to the product?
  **A:** The QR encodes `<origin>/verify?id=<productId>`. Opening it anywhere on the internet loads the public verification page for that exact ID.

*What to say out loud:* "If you ask something we haven't prepared, we'll walk you through the code in real time."

### 10. Known limitations (be honest)

- Runs on local Hardhat for the demo, not a public chain.
- IPFS uses a local Kubo daemon during the demo rather than a paid pinning service.
- IoT sensor stream (temperature/humidity) is mentioned in Part 1 but out of scope for Part 2 implementation.
- The MySQL layer is required for the demo but not strictly necessary if a subgraph or pure-chain solution were used in production.

*What to say out loud:* "We scoped Part 2 carefully so every feature is actually demonstrable on stage — not just described."

### 11. Member contributions

```md
| Name | Contributions |
|---|---|
| NOOR KHALIL ABDULLAH KHALED (TP078880) | [fill in before presentation] |
| TAHA FAHD AHMED MOHAMMED THABIT (TP078281) | [fill in before presentation] |
| ABUBAKER ELSIDDIG TAGELDEEN SIDDIG (TP078003) | [fill in before presentation] |
| MUHMMAD AHMED KHAN (TP069769) | [fill in before presentation] |
```

*What to say out loud:* "Each of us owned a specific layer of the system — we'll note who built what as the demo progresses."

### 12. Glossary

One-line definitions for: blockchain, smart contract, wallet, MetaMask, transaction, gas, event log, role, hash, CID, IPFS, provenance, tamper-proof, immutability, decentralisation.

*What to say out loud:* "These are the technical terms we'll use today — each one is one line in the glossary at the end of this document."

## Acceptance checks
- [ ] `PRESENTATION.md` is at the project root.
- [ ] Every section ends with an italics `*What to say out loud: ...*` line.
- [ ] No code block in the file is longer than 5 lines.
- [ ] Q&A section has at least 10 questions with answers.
- [ ] A non-technical member can open it and deliver the demo top-to-bottom without opening VS Code.

## STOP — request user review
After finishing, post exactly: `Phase 20 complete — requesting review.`
