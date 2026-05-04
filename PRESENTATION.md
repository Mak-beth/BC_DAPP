# Supply Chain DApp — Live Presentation Guide
**CT124-3-3-BCD Blockchain Development · Group 13**

| Name | TP Number |
|---|---|
| NOOR KHALIL ABDULLAH KHALED | TP078880 |
| TAHA FAHD AHMED MOHAMMED THABIT | TP078281 |
| ABUBAKER ELSIDDIG TAGELDEEN SIDDIG | TP078003 |
| MUHAMMAD AHMED KHAN | TP069769 |

---

## 1. The Problem in One Minute

Counterfeit goods cost the global economy USD 467 billion every year (OECD/EUIPO, 2025). When a company discovers a data breach in its supply chain, it takes an average of 283 days to detect and contain the incident (IBM, 2024). In healthcare alone, substandard and falsified medicines kill between 72,000 and 169,000 children annually (WHO, 2024).

The root cause is always the same: no single party in a multi-step supply chain can independently prove that a product is genuine, unaltered, and handled by the right people at every step. Paper certificates are forgeable. Centralised databases are controlled by one party and can be edited silently. There is no neutral, tamper-proof record that every participant — manufacturer, distributor, retailer, regulator, and consumer — can trust equally.

*What to say out loud: "In short, the world has a provenance problem. Nobody can prove where a product came from, who touched it, or whether it is safe — without trusting someone else's word. We built a system that removes that trust requirement."*

---

## 2. Our Solution in One Minute

We built a Supply Chain DApp on Ethereum (local Hardhat node). Every product is registered on-chain by a verified manufacturer. Every transfer of ownership, every status change, and every certification document is recorded as an immutable blockchain transaction that anyone can query without permission.

The system combines three layers: the blockchain for immutability and role enforcement, IPFS for decentralised document storage, and a MySQL database for human-readable metadata and address-book contacts. The frontend is built with Next.js 14 and TypeScript, and connects to MetaMask for signing.

Part 2 added IoT sensor logging (temperature and humidity stored on-chain), a product recall system (manufacturers can issue and lift recalls with a single transaction), and a three-theme design system that makes the interface look production-ready.

*What to say out loud: "This is not a prototype — every button actually calls the blockchain. Let us show you."*

---

## 3. Who Uses It

| Role | What they can do | Wallet required |
|---|---|---|
| Manufacturer | Add products, upload certifications to IPFS, log sensor readings, issue/lift recalls, transfer ownership | Yes |
| Distributor | Transfer ownership of products they hold, advance status | Yes |
| Retailer | Transfer ownership of products they hold, advance status | Yes |
| Regulator / Auditor | View the full audit log with five filter dimensions; export to CSV | No (read-only) |
| Public consumer | Scan a QR code or enter a product ID to verify authenticity on-chain | No |

*What to say out loud: "Notice that the most important user — the end consumer — needs no wallet, no account, and no technical knowledge. They just scan the QR on the packaging."*

---

## 4. Demo Script — 13 Steps

Follow these steps in order during the live presentation. Each step maps to a marking criterion.

### Step 1 — Dashboard (Role Badge and Stats)

Open `http://localhost:3000/dashboard`. Show the stat tiles (total products, recent events). Connect the Manufacturer wallet via MetaMask. Point out the role badge and company name that appear in the header.

*What to say out loud: "The role is read directly from the smart contract's `roles` mapping. There is no backend session — the blockchain is the authority."*

### Step 2 — Add Product (Part 1 §5.3)

Navigate to Add Product. Fill in a product name, origin country, and batch number. On step 2, drag in a PDF certificate (any file). On step 3, review the details and click Confirm and Submit. Approve the first MetaMask transaction (addProduct), then approve the second (addCertificationHash). Point to the status bar that reads "Uploading certification to IPFS..." then "Anchoring IPFS CID on-chain...".

*What to say out loud: "Two separate transactions. The first creates the product on-chain. The second pins the PDF to IPFS and writes the CID into the smart contract — this is the hybrid storage architecture from Part 1 §4.3."*

### Step 3 — Download QR Code

On the success screen, point to the QR code canvas. Click Download PNG. Show that the file saves to disk with the name `product-N-qr.png`.

*What to say out loud: "Anyone with this QR code can verify the product. The encoded URL points directly to our verify page with the product ID pre-filled."*

### Step 4 — Verify (Public, No Wallet)

Disconnect MetaMask. Navigate to `/verify`. Enter the product ID from step 2. Click Verify. Show the Authenticity Seal animation, the Verified on-chain badge, the current owner address, and the certification card with local and public IPFS gateway links.

*What to say out loud: "No wallet. No sign-in. Any smartphone can do this. This is the zero-trust consumer verification that Part 1 §5.2.1 promised."*

### Step 5 — QR Scan

Still on the Verify page, click Scan QR. Switch to the Upload tab. Upload the PNG downloaded in step 3. The scanner decodes the URL, extracts the product ID, and runs the verify automatically.

*What to say out loud: "The scanner works with both camera and image upload. In a real deployment the consumer would point their phone camera at the product packaging."*

### Step 6 — Track Page (Timeline and Status)

Navigate to `/track/[id]` for the product. Show the HistoryTimeline with the animated vertical line and the staggered entry animations. Point to the StatusProgressBar. Show the ProductQR component at the bottom.

*What to say out loud: "Every entry in this timeline is an immutable on-chain event. No one can delete or reorder them."*

### Step 7 — IPFS Certificate

Click the Local gateway link on the Track or Verify page. The browser opens `http://127.0.0.1:8080/ipfs/[CID]` and displays the certificate file. Copy the CID and show that the Public gateway link at ipfs.io resolves to the same file.

*What to say out loud: "The CID is the same whether you use our local daemon or the public IPFS network. The content is cryptographically verified at retrieval."*

### Step 8 — Audit Log with Filters (Part 1 §5.2.1)

Navigate to `/audit`. Show all events in the table and the donut chart. Apply a Product ID filter. Then add an Action filter. Show that the URL changes to include query parameters — copy and paste the URL into a new tab to show that the filtered view is fully shareable.

*What to say out loud: "A regulator investigating a specific batch can send this URL to a colleague and they will see exactly the same filtered view, with no setup required."*

### Step 9 — Contacts and Address Book

Navigate to `/contacts`. Show the saved contacts list. Add a new contact by entering a wallet address, name, and role. Show that the contact appears in the list with a role badge.

*What to say out loud: "Contacts are stored in MySQL, not on-chain — gas cost reasoning is in the documentation. But they feed directly into the Transfer Ownership modal."*

### Step 10 — Transfer Ownership (Part 1 §5.3)

Go back to the Track page. Click Transfer Ownership. In the modal, switch to the Pick from contacts tab. Select a saved contact from the dropdown. Click Transfer and approve in MetaMask. Show the HistoryTimeline updating with the new Ownership Transferred entry.

*What to say out loud: "Without the contacts address book, the user would have to type a 42-character hex address. One small UX decision makes the difference between a prototype and a usable product."*

### Step 11 — IoT Simulator (Part 1 §5.4)

Navigate to `/iot-simulator`. Enter the product ID, a temperature value (for example 245 for 24.5 degrees Celsius), and a humidity value (for example 72). Click Submit and approve in MetaMask. Navigate back to the Track page for that product and scroll to the SensorChart. Show the new data point on the dual-axis line graph.

*What to say out loud: "Temperature is stored in tenths of a degree to avoid floating-point issues on-chain. The chart converts it back on the client. This implements Part 1 §5.4 IoT integration."*

### Step 12 — Issue Recall (Product Safety)

Still on the Track page (with a Manufacturer wallet), click Issue Recall. Type a reason in the textarea (for example: Contamination detected — batch BATCH-001 affected). Click Issue Recall and approve in MetaMask. The red RecallBanner appears immediately on the Track page. Navigate to /verify for the same product and show the RecallBanner appearing there too, warning the public.

*What to say out loud: "The recall is stored on-chain. It is permanent, public, and visible to anyone who verifies this product — whether they are a retailer, a regulator, or a consumer scanning a QR code at a shop."*

### Step 13 — Lift Recall and Theme Switcher

Click Lift Recall on the Track page and approve in MetaMask. Show the banner disappearing. Finally, click the Sparkles button in the navbar to open the ThemeSwitcher. Switch from Nebula to Aurora — the entire interface transitions to teal. Switch to Obsidian — the interface transitions to charcoal/amber. Switch back to Nebula.

*What to say out loud: "The theme applies globally via a single CSS class on the html element. Every colour in every component — including the aurora background blobs — adapts automatically. This is one of the reasons we are aiming for the A+ band."*

---

## 5. What Makes This Worth High Marks

| Criterion | Evidence | Mark band |
|---|---|---|
| Smart contract completeness | 14 public functions, 8 events, 4 roles, sequential status transitions | 70+ |
| Role-gated authentication | `onlyRole` modifier; nav links filtered by on-chain role | 70+ |
| Product tracking and timeline | Immutable `HistoryEntry[]` on-chain; animated timeline UI | 70+ |
| IPFS integration | `uploadToIPFS` + `addCertificationHash`; CID stored on-chain | 70+ |
| Hybrid architecture | On-chain identity + IPFS documents + MySQL metadata (Part 1 §4.3) | 70+ |
| Audit dashboard with filters | 5-dimension filter bar; URL-serialised state for shareability | 80+ |
| Contacts address book | MySQL contacts table; one-click transfer via ContactPicker | 80+ |
| IoT sensor simulation | `logSensorReading` on-chain; dual-axis SensorChart on Track page | 80+ |
| Product recall system | `issueRecall` / `liftRecall`; RecallBanner on Verify and Track | 80+ |
| Test coverage | 43 tests: 29 original + 6 IoT + 8 Recall; all passing | 80+ |
| Three-theme design system | Nebula / Aurora / Obsidian; CSS custom properties; zero-reload switch | 90+ |
| QR code generation and scanning | ProductQR canvas; camera and upload scanner; shareable verify URL | 90+ |
| Transfer Ownership UI | TransferOwnershipModal with ContactPicker; save-new-contact checkbox | 90+ |

*What to say out loud: "We went significantly beyond the base requirements. Every feature in this table was implemented, tested, and is live in the demo you just saw."*

---

## 6. Screenshots Gallery

> Replace each placeholder with a real screenshot before the session.

**Gallery 1** — Dashboard: Manufacturer role badge + company name + stat tiles.

*[Insert screenshot]*

**Gallery 2** — Add Product step 2: certification file drag-and-drop zone with a PDF loaded.

*[Insert screenshot]*

**Gallery 3** — Add Product step 3: review panel + MetaMask popup visible.

*[Insert screenshot]*

**Gallery 4** — Success screen: confetti animation + ProductQR + Download PNG button.

*[Insert screenshot]*

**Gallery 5** — Track page: HistoryTimeline with three entries + StatusProgressBar at DELIVERED.

*[Insert screenshot]*

**Gallery 6** — Track page: SensorChart with temperature (purple line) and humidity (indigo line).

*[Insert screenshot]*

**Gallery 7** — Track page: red RecallBanner at the top of the result card.

*[Insert screenshot]*

**Gallery 8** — IssueRecallModal: reason textarea filled with sample reason + red Issue Recall button.

*[Insert screenshot]*

**Gallery 9** — Verify page: AuthenticitySeal + Verified on-chain badge + certification card with IPFS links.

*[Insert screenshot]*

**Gallery 10** — IPFS gateway in browser: the actual certificate PDF at 127.0.0.1:8080/ipfs/[CID].

*[Insert screenshot]*

**Gallery 11** — Audit page: two filters active + donut chart filtered + row count.

*[Insert screenshot]*

**Gallery 12** — IoT Simulator: form with product ID 1, temperature 245, humidity 72, success toast.

*[Insert screenshot]*

**Gallery 13** — Contacts page: three contacts with role badges + Add Contact button.

*[Insert screenshot]*

**Gallery 14** — TransferOwnershipModal: Pick from contacts tab open with saved contacts dropdown.

*[Insert screenshot]*

**Gallery 15** — ThemeSwitcher open, Aurora theme active, teal background visible.

*[Insert screenshot]*

---

## 7. Architecture in Plain Words

**Blockchain layer.** This is the single source of truth. The `SupplyChain.sol` contract stores every product, every ownership record, every sensor reading, and every recall decision in Ethereum storage. No one can alter these records without holding the correct private key and passing the `onlyRole` or `onlyOwner` checks. We run a local Hardhat node during the demo but the contract is identical to what would be deployed on a live testnet.

**Off-chain storage layer.** IPFS (the InterPlanetary File System) stores certification documents. When a file is added to IPFS, the network computes a Content Identifier — a cryptographic fingerprint — and anyone who knows the CID can retrieve the exact same file from any IPFS node in the world. We write this CID into the smart contract, so the link between the product and its documentation is also immutable and on-chain. Think of IPFS as a blockchain for files.

**Application layer.** Next.js 14 handles both the user interface and the server-side API routes. When the page needs data that is on-chain, it calls the smart contract directly via ethers v6. When it needs human-readable metadata (product description, contact names, company names), it calls a MySQL database via the `/api/*` routes. This split is exactly what Part 1 §4.3 described as hybrid data storage.

**User layer.** MetaMask is the bridge between the user and the blockchain. When a manufacturer clicks Confirm and Submit, MetaMask signs the transaction with their private key and submits it to the Hardhat node. When a public consumer scans a QR code, no wallet is involved — the page makes a read-only call to the contract using a `JsonRpcProvider` that needs no authorisation at all.

---

## 8. Q&A Preparation

**Q1: Why Hardhat instead of a public testnet?**
Hardhat gives us a deterministic, fast, and free environment. Every test run and every demo starts from the same state. A public testnet like Sepolia would require faucet tokens and has unpredictable confirmation times that would disrupt a live presentation. The contract code is identical and could be deployed to a testnet in under a minute.

**Q2: What stops someone from calling `addProduct` with someone else's wallet?**
The `onlyRole(MANUFACTURER)` modifier checks `roles[msg.sender]`. The `msg.sender` is set by the Ethereum protocol from the cryptographic signature on the transaction — it cannot be spoofed. Only an address that the admin has explicitly assigned the MANUFACTURER role can call `addProduct`.

**Q3: Why store the IPFS CID on-chain instead of the file itself?**
Storing a file on-chain would be prohibitively expensive. Ethereum charges approximately 68,000 gas per kilobyte of calldata. A one-megabyte PDF would cost thousands of dollars at mainnet prices. The CID is 59 bytes (a Bafybeib... string), costs a few thousand gas, and provides the same cryptographic guarantee: if the CID matches, the file is byte-for-byte identical.

**Q4: How does the QR code link back to the blockchain?**
The QR code encodes the URL `http://localhost:3000/verify?id=N`. When scanned, the Verify page reads the `id` parameter, calls `contract.verifyProduct(id)` using a read-only provider, and displays the result. The QR code is purely a convenience — the blockchain query is the actual verification.

**Q5: What if the IPFS daemon is offline?**
The on-chain CID remains permanently stored. If our local daemon is offline, the user can still retrieve the file from any public IPFS gateway (we also show the ipfs.io link). The Verify page is designed to handle missing certification gracefully — the product is still verified on-chain even if the file cannot be fetched.

**Q6: Why does `updateStatus` only allow sequential transitions?**
The check `uint8(newStatus) == uint8(products[id].status) + 1` prevents a retailer from marking a product SOLD before it has been received (DELIVERED). This enforces a real-world constraint: you cannot sell what you have not received. The test suite has a dedicated case for invalid jumps (`CREATED` to `DELIVERED`) that confirms the revert.

**Q7: Can a distributor issue a recall?**
No. `issueRecall` uses `onlyRole(MANUFACTURER)`. Only the original manufacturer role can issue or lift recalls. This reflects real-world product liability law: a distributor can report a safety concern but cannot unilaterally issue a public recall.

**Q8: How does the IoT data reach the blockchain?**
In this implementation, a role-holder (Manufacturer, Distributor, or Retailer) submits sensor readings manually via the IoT Simulator page. In a production deployment, IoT gateway software with a funded wallet would call `logSensorReading` automatically at regular intervals. The smart contract has no way to distinguish a human submission from an automated one — both are just signed transactions.

**Q9: Why are contacts stored in MySQL and not on-chain?**
Contacts are operationally sensitive (they reveal business relationships) and change frequently. Storing them on-chain would cost gas on every update and make them permanently public. MySQL allows fast lookup, upsert with `ON DUPLICATE KEY UPDATE`, and deletion — none of which are natural on a blockchain. The contacts table never bypasses the on-chain `roles` mapping: the contract still checks that the recipient has a valid role before accepting a transfer.

**Q10: How does the theme system work technically?**
The `ThemeProvider` toggles a class (`theme-aurora` or `theme-obsidian`) on the `<html>` element. CSS custom properties (CSS variables) defined under those classes override the defaults. Every component uses `var(--sig-1)` instead of a hardcoded colour, so the entire UI repaints instantly — no re-render, no React state update, just a single DOM class mutation.

**Q11: What are the 43 tests testing?**
Nine `describe` blocks: Deployment (3 tests), Role Assignment (4), Add Product (5), Transfer Ownership (5), Update Status (6), Verify Product (2), Read Functions (3), Product Recall (8), and IoT Sensor Readings (6). Every function has at least one positive test and one revert test. The access-control tests confirm that wrong-role callers are rejected with the correct revert message.

**Q12: How long does a typical transaction take in the demo?**
On the local Hardhat node, transactions are mined in milliseconds — there is no real proof-of-work or proof-of-stake delay. The only latency is the MetaMask modal interaction (user clicking Confirm) and the IPFS upload time for the certification document.

**Q13: Why is temperature stored as `int256` in tenths of a degree?**
Solidity does not have native floating-point types. Storing 24.5 degrees as the integer 245 is the standard pattern for fixed-point arithmetic on EVM. The frontend divides by 10 before displaying the value to the user. The choice of `int256` (signed) allows negative temperatures, which is important for cold-chain pharmaceutical products.

**Q14: What would change to go to a real production deployment?**
Replace the Hardhat node with a deployment to Sepolia or Polygon. Replace the local IPFS daemon with Pinata or Web3.Storage for guaranteed persistence. Move secrets to a proper secrets manager. Add a backend event listener that syncs blockchain events to MySQL in real time. The smart contract code and the frontend component logic would be unchanged.

**Q15: How do you handle the case where a product has no recall?**
The `getRecall` function returns a `RecallEntry` struct. If no recall has ever been issued, the `active` field is `false` and `reason` is an empty string. The frontend wraps the call in a try/catch (because the contract reverts for non-existent products) and checks `recall.active` before rendering the `RecallBanner`. If `active` is false, no banner is shown.

**Q16: Why use Framer Motion instead of CSS animations?**
Framer Motion provides layout-aware animations (the `layoutId="nav-pill"` spring that slides the active nav indicator) and exit animations via `AnimatePresence` that would be complex to implement in pure CSS. The timeline stagger (`delay: 0.15 + i * 0.06`) is trivial in Framer Motion but requires JavaScript timing in plain CSS. The performance cost is negligible for a dashboard-style UI.

**Q17: Is the audit log stored on-chain or off-chain?**
The authoritative provenance record (the `HistoryEntry[]` array returned by `getHistory`) is entirely on-chain. The `events_log` MySQL table is a supplementary off-chain mirror that powers the Audit page with richer metadata (batch number join) and faster filtering. If the MySQL database were wiped, all historical events could be reconstructed by replaying the blockchain event logs.

**Q18: What is the ContactPicker's `allowRoles` prop used for?**
In a future enhancement, the `TransferOwnershipModal` could pass `allowRoles={["DISTRIBUTOR"]}` to restrict the picker to contacts who are distributors — enforcing the supply chain direction (Manufacturer ships to Distributor, Distributor ships to Retailer). Currently the prop is wired but not restricted, so any saved contact can be selected.

**Q19: Could two manufacturers both try to recall the same product?**
The `issueRecall` function requires `!recalls[productId].active` — it reverts with "SupplyChain: Already recalled" if a recall is already active. The first transaction to be mined wins. The second transaction would revert and the caller would receive a MetaMask error. Only one active recall can exist per product at any time.

---

## 9. Known Limitations

The following limitations are known and honest. They do not affect the mark, but the examiner may ask about them.

- The Hardhat node is ephemeral. Restarting it wipes all state, requiring a fresh deployment and `assignGroupRoles` run. A persistent testnet deployment would resolve this.
- The local IPFS daemon must be running for certification uploads. The application handles the case where IPFS is offline gracefully (the product is still added on-chain without a certification).
- The IoT Simulator requires a wallet. In a real implementation, IoT devices would use a dedicated funded account with the appropriate role; the UI simulator is a stand-in for that automated pipeline.
- There is no pagination on the Audit page. With thousands of events, the initial load would be slow. An offset-based API endpoint would be required for production.
- The contacts table has no encryption. Contact addresses and names are stored in plaintext in MySQL. A production system would encrypt sensitive fields at rest.
- MetaMask does not natively support switching between Hardhat accounts without importing private keys. During the demo, each role switch requires selecting a different imported account in MetaMask manually.

---

## 10. Member Contributions

| Name | TP Number | Contribution |
|---|---|---|
| NOOR KHALIL ABDULLAH KHALED | TP078880 | [fill in — e.g. Smart contract, testing, IPFS integration] |
| TAHA FAHD AHMED MOHAMMED THABIT | TP078281 | [fill in — e.g. Frontend, API routes, UI/UX design] |
| ABUBAKER ELSIDDIG TAGELDEEN SIDDIG | TP078003 | [fill in — e.g. IoT simulator, recall system, contacts] |
| MUHMMAD AHMED KHAN | TP069769 | [fill in — e.g. Audit dashboard, theme system, QR] |

---

## 11. Glossary

| Term | Plain-English definition |
|---|---|
| Blockchain | A shared ledger where every record is linked to the previous one by a cryptographic hash, making any alteration detectable |
| Smart contract | A program that lives on the blockchain and executes automatically when called; no one controls it once deployed |
| Solidity | The programming language used to write Ethereum smart contracts |
| Hardhat | A local Ethereum development environment; runs a private blockchain on your laptop |
| Wallet | Software (MetaMask) that holds a private key and signs transactions; your identity on the blockchain |
| Private key | A secret 256-bit number that proves ownership of a wallet address; never shared |
| Gas | The fee paid to the network to execute a transaction; measured in wei (the smallest ETH unit) |
| IPFS | InterPlanetary File System; a peer-to-peer network that stores files by their content hash (CID) rather than a location |
| CID | Content Identifier; the cryptographic fingerprint IPFS assigns to a file; identical files always have the same CID |
| ABI | Application Binary Interface; the specification that tells ethers how to encode and decode smart-contract function calls |
| onlyRole modifier | A Solidity function guard that reverts the transaction if `msg.sender` does not hold the required role |
| MetaMask | A browser extension that injects `window.ethereum` and lets users sign blockchain transactions |
| ethers v6 | A JavaScript/TypeScript library for interacting with Ethereum; handles ABI encoding, providers, and signers |
| Recall | An on-chain flag (the `RecallEntry.active` boolean) that signals a product is unsafe; visible to anyone who queries the contract |
| CSS custom property | A variable defined with `--name: value` in CSS that can be overridden by a parent selector; the mechanism behind the theme system |
