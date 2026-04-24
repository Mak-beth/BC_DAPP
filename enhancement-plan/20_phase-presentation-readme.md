# Phase 20 — Presentation README (`PRESENTATION.md`)

## Goal
Produce a single plain-English file at the project root — `PRESENTATION.md` — that any Group 13 member can open during the live presentation and **read aloud to the lecturer** without needing to understand the code. This is the bridge between the AI-written code and a non-technical presenter. The file must also provide strong academic justification — explicitly linking every feature to a Part 1 promise and to the marking rubric — because the lecturer is strict about justification.

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
6. **Every feature claim must cite either a Part 1 section or the marking rubric.** The examiner is strict: a feature described without justification scores lower than a feature linked back to a proposal commitment.

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
| Distributor  | Accepts ownership transfer, updates status to In Transit |
| Retailer     | Accepts ownership transfer, marks products as Delivered or Sold |
| Regulator    | Reads the audit log; filters events by product, batch, or date |
| Public       | Scans a QR or enters a product ID to verify authenticity — no wallet needed |
```

*What to say out loud:* "Five types of user take part: manufacturers, distributors, retailers, regulators — and any member of the public can verify a product with no crypto wallet."

### 5. The demo script (8–10 minutes)

Step-by-step what to click, what to say. Cover this order:

1. **Open the dashboard** — point out the stat tiles, the role badge, the theme. Say *"This is a manufacturer's dashboard. The role badge tells us what this wallet is allowed to do on the blockchain."*

2. **Add Product wizard** — walk through step 1 (fill in details), step 2 (drop a certificate PDF), step 3 (review). Click Submit. While MetaMask pops up, say *"The browser is asking MetaMask to sign a transaction. Until I approve it here, nothing is written to the blockchain."* After confetti: *"The product is now registered on-chain. This QR code links to its public verification page."*

3. **Download the QR PNG** — right-click Save, show the file.

4. **Verify page** — click "Scan QR", stay on the **Upload** tab, drop the PNG. Show how it auto-fills and auto-verifies. Say *"I am simulating a retailer scanning a real packaging QR. The app confirms the product is authentic and shows its current owner."*

5. **Track page** — click "View Full History". Point at the timeline and status progress bar. Say *"Every handoff is an entry on the timeline. This is the ledger Part 1 promised."*

6. **IPFS certificate link** — click "Local gateway"; show the PDF opens from IPFS. Say *"The certificate is not stored in any company's database. It is on IPFS, and the hash that proves it has not changed is written on-chain."*

7. **Audit page** — filter by Product ID or a date range; show the donut chart changing live. Click "Export CSV". Say *"This is the regulator's view — filterable by product, batch, or date range, exactly as promised in our Part 1 proposal."*

8. **Contacts address book** — click "Contacts" in the navbar. Click "Add Contact". Paste in a second wallet address, give it the name "Distributor Co", set Role to DISTRIBUTOR. Save. Say *"Rather than typing a 42-character address every time, we save counterparties here — the same way a bank lets you save payees."*

9. **Transfer ownership via ContactPicker** — return to the Dashboard, open a product card and click "Transfer". The Transfer Ownership modal opens. Click the "From Contacts" tab — Distributor Co appears. Select it. Click Transfer. MetaMask prompts; approve. Say *"The smart contract has just changed the recorded owner of this product. No company controls this — it is enforced by code on the blockchain."*

10. **Theme switcher** — click the palette icon in the navbar. Switch to Aurora theme — the entire application retints to mint and sky instantly. Switch to Obsidian — monochrome with bronze accents. Switch back to Nebula. Say *"Three named themes prove that every colour in this application comes from a central token system — no individual component has a hardcoded colour."*

*What to say out loud:* "We will walk through a full product journey: create, verify, track, audit, transfer, and theme — all in under ten minutes."

### 6. What makes this worth high marks

The table below maps every A+ marking criterion to a live demonstration:

```md
| Marking criterion (A+, 80–100%) | Implementation evidence |
|---|---|
| Complete implementation of all proposed features | transferOwnership, addProduct, verifyProduct, addCertificationHash, getHistory — all with UI paths (Part 1 §5.3) |
| IPFS off-chain storage + on-chain CID | Certificate uploaded to IPFS; CID returned and anchored via addCertificationHash (Part 1 §4.3, §4.5) |
| QR code for retailer / consumer verification | ProductQR.tsx generates; QRScanner.tsx upload-tab decodes without a camera (Part 1 §5.2.1) |
| Audit dashboard with product / batch / date filters | FilterBar.tsx AND-combined, URL-synced so filters survive reload (Part 1 §5.2.1) |
| Role-gated MetaMask authentication | onlyRole modifier on-chain; role pill and glow badge in UI (Part 1 §5.2.1) |
| 4-layer architecture matching Part 1 Figure 1 | Mermaid diagram in documentation_group13.md Figure 1; all four layers running in the demo |
| Outstanding quality; professional presentation | Aurora animated background, three-theme CSS variable system, framer-motion design |
| Complete documentation with code figures | documentation_group13.md: 12+ Figure X.Y snippets; Part 1 to Part 2 mapping table |
| Testing | 29 passing Hardhat tests covering every role-gated function |
```

Additional Part 1 parity points:
- Hybrid on-chain / off-chain with real IPFS (Part 1 §4.3–4.5)
- QR code scan both by camera and by uploading an image (Part 1 §5.2.1)
- Audit dashboard with product / batch / date-range filters (Part 1 §5.2.1)
- Role-gated MetaMask authentication (Part 1 §5.2.1)
- Four-layer architecture matching Part 1 Figure 1
- Every feature has a code figure in the documentation pack
- Transfer ownership surfaced as a one-click UI action, not a console command

*What to say out loud:* "Every promise in our Part 1 proposal is implemented, demonstrable on screen, and referenced by a figure number in the documentation."

### 7. Screenshots gallery

A list of placeholders for the group to paste real screenshots into before submission:
```md
- `[SCREENSHOT: Dashboard with role badge + stat tiles]`
- `[SCREENSHOT: Add Product step 3 review]`
- `[SCREENSHOT: Success screen with confetti + QR]`
- `[SCREENSHOT: Verify with QR scanner modal, Upload tab]`
- `[SCREENSHOT: Track page full timeline + status progress bar]`
- `[SCREENSHOT: IPFS gateway displaying the certificate file]`
- `[SCREENSHOT: Audit page, filters active, donut chart]`
- `[SCREENSHOT: Contacts page with saved contacts and role badges]`
- `[SCREENSHOT: Transfer Ownership modal, ContactPicker showing saved contacts]`
- `[SCREENSHOT: Aurora theme active — full dashboard view]`
```

*What to say out loud:* "These screenshots match each step of our demo."

### 8. Architecture in plain words

Four short paragraphs — one per layer. No diagram; just link: *"See documentation/documentation_group13.md Figure 1."*

**Layer 1 — User Layer.** This is anyone who interacts with the system: manufacturers who register products, distributors and retailers who accept ownership, regulators who audit the logs, and members of the public who verify products. IoT devices can also push sensor data to the application layer.

**Layer 2 — Application Layer.** The Next.js frontend runs in the user's browser. It talks to two backends: a set of API routes that read and write MySQL for fast queries and display metadata, and the blockchain for the authoritative record of ownership and status.

**Layer 3 — Blockchain Layer.** A single Solidity smart contract (`SupplyChain.sol`) runs on a Hardhat local node. It enforces role permissions, records every status change, and stores IPFS content identifiers on-chain. Once written, these records cannot be altered.

**Layer 4 — Off-Chain Storage Layer.** Documents such as certificates are too large to store on a blockchain economically. We upload them to IPFS (InterPlanetary File System), a decentralised file network, and anchor the file's unique fingerprint (CID) on-chain. Anyone with the CID can verify the file has not changed.

*What to say out loud:* "The app has four layers: the user's browser, the Next.js backend, the Ethereum smart contract, and IPFS for documents — exactly as we designed in Part 1."

### 9. Q&A preparation

Write each as "Q: … / A: …". All answers must be short enough to deliver in under 30 seconds.

- **Q:** What is a smart contract?
  **A:** A program stored on the blockchain that anyone can run but nobody can edit after deployment. Our contract enforces who can register products, transfer ownership, and update status.

- **Q:** Why not deploy to Ethereum mainnet?
  **A:** For a classroom demo we use Hardhat — a free, fast local blockchain. The same Solidity contract deploys unchanged to any EVM-compatible network. The code is production-ready; only the network differs.

- **Q:** What happens if the IPFS node goes offline?
  **A:** The CID is already anchored on-chain. The file can be re-pinned from any IPFS node that has a copy, and the hash proves it is the original. IPFS is designed so no single node is a single point of failure.

- **Q:** Can someone tamper with the MySQL database?
  **A:** Yes — but the database only stores display metadata. Ownership and status live on-chain, which cannot be altered. The blockchain is the source of truth; MySQL is a read cache for the UI.

- **Q:** How do you prevent someone granting themselves the manufacturer role?
  **A:** Role assignment is gated by `onlyOwner` on the contract. Only the contract deployer (the account that ran `deploy.ts`) can call `assignRole`. No other account can grant itself a role through any contract function.

- **Q:** Why pair a blockchain with MySQL at all?
  **A:** Fast UI queries such as "show all my products" would require scanning every on-chain event each time — slow and expensive. MySQL caches display metadata for instant page loads. The blockchain remains the authority for ownership and status.

- **Q:** What is a CID?
  **A:** A Content Identifier — the unique fingerprint of a file on IPFS. Change one byte of the file and the CID changes completely. This is how we prove a certificate has not been altered since it was uploaded.

- **Q:** Is the data encrypted?
  **A:** Data on-chain is public by design. Sensitive documents can be stored encrypted off-chain, but our demo keeps files readable so the examiner can verify the IPFS link resolves to the actual certificate.

- **Q:** Why did you build an address book for contacts?
  **A:** A 42-character Ethereum address typed incorrectly transfers ownership to a stranger — permanently and irreversibly. The contacts layer makes transfers safer and faster while leaving the blockchain record as authoritative.

- **Q:** How does the smart contract prevent someone from transferring a product they do not own?
  **A:** The `transferOwnership` function has a `require` check: `msg.sender` must equal `products[id].currentOwner`. The EVM verifies the caller's identity from the digital signature on the transaction; any mismatch reverts the whole call.

- **Q:** Why three themes? Is one not sufficient?
  **A:** Three themes prove the CSS architecture is correct. If colours were hardcoded in components, a second theme would require editing every file. Because every colour is a CSS variable, three themes required only three CSS blocks — that is the mark of a production-quality design system.

- **Q:** How does your UI meet accessibility requirements?
  **A:** The `prefers-reduced-motion` media query collapses all animations to a 10 ms opacity fade. Every interactive element has a `focus-visible` ring for keyboard navigation. Colour contrast meets WCAG AA in all three themes.

- **Q:** How does your documentation justify every design decision?
  **A:** Every feature section opens with a sentence linking it to a Part 1 section and the marking criterion it satisfies. A Part 1 to Part 2 mapping table at the top lets the examiner find any promise and its implementation in under ten seconds.

- **Q:** What if two manufacturers try to register products at the same time?
  **A:** The contract assigns IDs sequentially and emits a `ProductAdded` event per registration. The frontend parses the event receipt rather than reading a counter, so concurrent submissions produce two distinct product IDs without collision.

*What to say out loud:* "If you ask something we have not prepared, we will walk you through the code in real time."

### 10. Known limitations (be honest)

- Runs on a local Hardhat node for the demo, not a public chain. The same contract deploys to any EVM network.
- IPFS uses a local Kubo daemon during the demo rather than a paid pinning service. In production, a service such as Pinata or Filebase would pin files redundantly.
- IoT sensor stream (temperature/humidity) is described in Part 1 §5.4 but was scoped out of Part 2 implementation as a future extension.
- The MySQL layer is required for the demo but not strictly necessary; a subgraph or pure on-chain event log could replace it in a production deployment.

*What to say out loud:* "We scoped Part 2 carefully so every feature we claim is actually demonstrable on stage — not just described."

### 11. Member contributions

```md
| Name | Contributions |
|---|---|
| NOOR KHALIL ABDULLAH KHALED (TP078880) | [fill in before presentation] |
| TAHA FAHD AHMED MOHAMMED THABIT (TP078281) | [fill in before presentation] |
| ABUBAKER ELSIDDIG TAGELDEEN SIDDIG (TP078003) | [fill in before presentation] |
| MUHMMAD AHMED KHAN (TP069769) | [fill in before presentation] |
```

*What to say out loud:* "Each of us owned a specific layer of the system — we will note who built what as the demo progresses."

### 12. Glossary

One-line definitions for every term used in the presentation:

- **Blockchain** — a shared ledger where records are added in permanent, tamper-proof blocks linked by cryptographic hashes.
- **Smart contract** — a program stored on the blockchain that enforces rules automatically; no human intermediary can override it.
- **Wallet** — a cryptographic key pair that identifies a user on the blockchain; the private key signs transactions, the public key is the address.
- **MetaMask** — a browser extension that manages a user's wallet and signs blockchain transactions on their behalf.
- **Transaction** — a signed instruction sent to the blockchain to call a contract function; costs a small fee called gas.
- **Gas** — the fee paid to the network to process a transaction; on our local Hardhat node it is free.
- **Event log** — a record emitted by a smart contract when something happens (e.g. `ProductAdded`); stored permanently on-chain and readable by anyone.
- **Role** — a permission level in the smart contract (MANUFACTURER, DISTRIBUTOR, RETAILER, REGULATOR) that gates which functions a wallet can call.
- **Hash** — a fixed-length fingerprint of data; any change to the input produces a completely different hash.
- **CID** — Content Identifier; IPFS's content-addressed hash of a file. Change one byte and the CID changes.
- **IPFS** — InterPlanetary File System; a decentralised network where files are addressed by their content hash, not a server location.
- **Provenance** — the documented history of a product's origin, ownership, and custody chain.
- **Tamper-proof** — once a record is written to the blockchain it cannot be altered or deleted by any party.
- **Immutability** — the property that blockchain data cannot be changed after it is written.
- **Decentralisation** — no single company or server controls the record; the blockchain is maintained by many nodes simultaneously.

*What to say out loud:* "These are the technical terms we will use today — each is defined in one line in the glossary at the end of this document."

## Acceptance checks
- [ ] `PRESENTATION.md` is at the project root.
- [ ] Every section ends with an italics *What to say out loud: ...* line.
- [ ] No code block in the file is longer than 5 lines.
- [ ] The demo script has at least 10 steps (including contacts, transfer, and theme switcher).
- [ ] Q&A section has at least 14 questions with answers.
- [ ] Section 6 includes the marking-rubric alignment table.
- [ ] Every feature claim in section 6 cites a Part 1 section or marking criterion.
- [ ] A non-technical member can open it and deliver the demo top-to-bottom without opening VS Code.

## STOP — request user review
After finishing, post exactly: `Phase 20 complete — requesting review.`
