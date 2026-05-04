# Presentation Feature Guide — Supply Chain DApp (Group 13)

> **Purpose.** This is a study sheet for the live presentation. Every feature in the project is listed once, with: (1) what it does, (2) why we built it that way, (3) the exact files and line ranges where the code lives, and (4) one or two lines you can say out loud when the panel asks "where's that in the code?".
>
> The companion documents are:
> - [PRESENTATION.md](../PRESENTATION.md) — the spoken script for the demo (13 steps + Q&A).
> - [documentation_group13.md](documentation_group13.md) — the long-form technical report.
>
> This guide bridges the two: it is the panel-defence cheat sheet.

---

## 0. Project at a Glance

A three-layer Ethereum DApp that proves the provenance of physical products end-to-end:

1. **Smart-contract layer** — [hardhat-project/contracts/SupplyChain.sol](../hardhat-project/contracts/SupplyChain.sol) holds every product, ownership change, sensor reading, certification hash, and recall. Tamper-evident by construction.
2. **Off-chain storage** — IPFS stores bulk certification PDFs; only the content-address (CID) is anchored on-chain. MySQL stores human-readable metadata, contacts, and an event mirror that powers fast filtering.
3. **Application layer** — Next.js 14 + ethers v6 + Tailwind. MetaMask is the wallet bridge for write actions. Read actions (verify) use a permissionless `JsonRpcProvider` so consumers need no wallet.

Four roles are enforced by the contract: `MANUFACTURER`, `DISTRIBUTOR`, `RETAILER`, `NONE`. A fifth "Regulator/Consumer" persona is read-only and needs no on-chain identity.

**One-line elevator pitch:** *"Every action that matters is signed on-chain by an address with the right role; every document is anchored by its IPFS hash; every consumer can verify with a phone, no account needed."*

---

## 1. Smart-Contract Layer

All references in this section are to [hardhat-project/contracts/SupplyChain.sol](../hardhat-project/contracts/SupplyChain.sol).

### 1.1 Role-Based Access Control (RBAC)

- **What it does.** Defines four roles in an enum and gates every state-changing function with either `onlyRole(...)` or `onlyOwner(productId)`. The deploying wallet (admin) is the only address that can grant roles.
- **Why we used it.** Real supply chains have a fixed hierarchy — only manufacturers can mint a product, only the current holder can transfer it, only manufacturers can recall it. We push the rule into the contract so the rule is the law, not a UI suggestion that can be bypassed.
- **Where the code lives:**
  - [SupplyChain.sol:5](../hardhat-project/contracts/SupplyChain.sol#L5) — `enum Role { NONE, MANUFACTURER, DISTRIBUTOR, RETAILER }`.
  - [SupplyChain.sol:31](../hardhat-project/contracts/SupplyChain.sol#L31) — `mapping(address => Role) public roles` (the source of truth queried by every guard and by the navbar).
  - [SupplyChain.sol:55](../hardhat-project/contracts/SupplyChain.sol#L55) — `address public immutable admin` set in the constructor.
  - [SupplyChain.sol:57](../hardhat-project/contracts/SupplyChain.sol#L57) — `event RoleAssigned(address indexed user, Role role)`.
  - [SupplyChain.sol:72-75](../hardhat-project/contracts/SupplyChain.sol#L72-L75) — the `onlyRole` modifier.
  - [SupplyChain.sol:77-81](../hardhat-project/contracts/SupplyChain.sol#L77-L81) — the `onlyOwner(productId)` modifier (existence check + owner check).
  - [SupplyChain.sol:83-86](../hardhat-project/contracts/SupplyChain.sol#L83-L86) — the `productExists(id)` modifier.
  - [SupplyChain.sol:88-91](../hardhat-project/contracts/SupplyChain.sol#L88-L91) — constructor: admin becomes a manufacturer automatically.
  - [SupplyChain.sol:93-99](../hardhat-project/contracts/SupplyChain.sol#L93-L99) — `assignRole(user, role)`. Admin-only, NONE forbidden.
- **Talking points.** "`msg.sender` cannot be spoofed because it's set by the EVM from the transaction signature. So the modifier on line 73 is a hard cryptographic gate, not a UI check."

### 1.2 Product Registration (`addProduct`)

- **What it does.** A manufacturer creates a new product with name, origin, batch number. The contract auto-assigns the next ID, records the creator as the current owner, sets status to `CREATED`, writes the first history entry, and emits `ProductAdded`.
- **Why we used it.** Provenance starts at the moment of creation. Once on-chain, the (id, manufacturer, batch, timestamp) tuple cannot be re-written.
- **Where the code lives:**
  - [SupplyChain.sol:8-16](../hardhat-project/contracts/SupplyChain.sol#L8-L16) — `Product` struct.
  - [SupplyChain.sol:54](../hardhat-project/contracts/SupplyChain.sol#L54) — `productCounter` (private, monotonic).
  - [SupplyChain.sol:58](../hardhat-project/contracts/SupplyChain.sol#L58) — `event ProductAdded(uint256 indexed id, address indexed manufacturer)`.
  - [SupplyChain.sol:101-130](../hardhat-project/contracts/SupplyChain.sol#L101-L130) — full `addProduct` body. Note the three required-field guards on lines 106-108 and the first `HistoryEntry` push on lines 123-127.
  - [SupplyChain.sol:171-173](../hardhat-project/contracts/SupplyChain.sol#L171-L173) — `getProduct(id)` view.
  - [SupplyChain.sol:179-181](../hardhat-project/contracts/SupplyChain.sol#L179-L181) — `getTotalProducts()` (used by the dashboard to enumerate IDs 1..N).
- **Talking points.** "Two transactions are submitted from the Add Product wizard — `addProduct` is the first; the certification anchor is the second. We deliberately keep them separate so a product can exist without a certification PDF."

### 1.3 Sequential Status Lifecycle (`updateStatus`)

- **What it does.** Allows the current owner to advance a product through `CREATED → IN_TRANSIT → DELIVERED → SOLD`. Refuses any non-sequential transition or any change after `SOLD`.
- **Why we used it.** Real-world constraint: you cannot mark a product `SOLD` before it has been `DELIVERED`. The check is on-chain so even a buggy or malicious frontend cannot bypass it.
- **Where the code lives:**
  - [SupplyChain.sol:6](../hardhat-project/contracts/SupplyChain.sol#L6) — `enum Status { CREATED, IN_TRANSIT, DELIVERED, SOLD }`.
  - [SupplyChain.sol:60](../hardhat-project/contracts/SupplyChain.sol#L60) — `event StatusUpdated(uint256 indexed id, Status status)`.
  - [SupplyChain.sol:149-162](../hardhat-project/contracts/SupplyChain.sol#L149-L162) — `updateStatus`. Line 150 blocks any change after SOLD; **line 151 is the headline guard** — `uint8(newStatus) == uint8(products[id].status) + 1`.
- **Talking points.** "The `+ 1` on line 151 is what enforces the chain-of-custody order. Skip a step, and the transaction reverts."

### 1.4 Ownership Transfer (`transferOwnership`)

- **What it does.** Current owner hands a product to another wallet. Recipient must (a) be non-zero, (b) hold a valid on-chain role, (c) not be the sender themselves.
- **Why we used it.** Custody changes hands many times in a real chain (factory → 3PL → distributor → retailer). Each handoff is an on-chain event with an actor and a timestamp.
- **Where the code lives:**
  - [SupplyChain.sol:59](../hardhat-project/contracts/SupplyChain.sol#L59) — `event OwnershipTransferred(uint256 indexed id, address from, address to)`.
  - [SupplyChain.sol:132-147](../hardhat-project/contracts/SupplyChain.sol#L132-L147) — full body. Three guards on lines 133-135; ownership swap on line 138; history append on lines 140-144.
- **Talking points.** "Line 134 (`roles[to] != Role.NONE`) is the link between the on-chain RBAC and the transfer flow — you cannot ship to a wallet that has no role."

### 1.5 Public Verification (`verifyProduct`)

- **What it does.** Read-only function that returns `(exists, currentOwner, status)` for a product. No wallet, no signature, no gas.
- **Why we used it.** Consumers need to verify authenticity from a phone. They cannot be expected to install MetaMask. A view function called over JSON-RPC is free.
- **Where the code lives:**
  - [SupplyChain.sol:164-169](../hardhat-project/contracts/SupplyChain.sol#L164-L169) — the function. Note the `productExists` modifier — non-existent IDs revert rather than returning falsy data.
- **Talking points.** "Look at our verify page — it builds a contract instance with a `JsonRpcProvider`, not a `BrowserProvider`. There is no `msg.sender` for a view call."

### 1.6 Certification Anchoring (`addCertificationHash`)

- **What it does.** Stores a list of `(cid, fileName, timestamp, uploader)` tuples per product. The CID is an IPFS Content Identifier — a cryptographic hash of the PDF.
- **Why we used it.** Hybrid storage. Putting a 1 MB PDF on-chain costs roughly 68,000 gas per kilobyte (≈$1,000+ on mainnet). A 59-byte CID costs ~5,000 gas, and the CID *is* the integrity proof — the file can be re-fetched from any IPFS gateway and validated against the on-chain hash.
- **Where the code lives:**
  - [SupplyChain.sol:24-29](../hardhat-project/contracts/SupplyChain.sol#L24-L29) — `CertificationEntry` struct.
  - [SupplyChain.sol:34](../hardhat-project/contracts/SupplyChain.sol#L34) — `mapping(uint256 => CertificationEntry[]) private certifications`.
  - [SupplyChain.sol:61](../hardhat-project/contracts/SupplyChain.sol#L61) — `event CertificationAdded`.
  - [SupplyChain.sol:183-205](../hardhat-project/contracts/SupplyChain.sol#L183-L205) — `addCertificationHash`. Owner-only and existence-checked.
  - [SupplyChain.sol:207-209](../hardhat-project/contracts/SupplyChain.sol#L207-L209) — `getCertifications(id)`.
- **Talking points.** "If our IPFS daemon is down, the CID is still on-chain — the consumer can re-fetch the PDF from the public ipfs.io gateway. The on-chain anchor is what survives."

### 1.7 IoT Sensor Logging (`logSensorReading`)

- **What it does.** Any wallet with a valid role can submit `(temperature, humidity)` readings for a product. Temperature is stored as `int256` in tenths of a degree (e.g. 245 = 24.5 °C); humidity is `uint256` capped at 100.
- **Why we used it.** Cold-chain compliance — pharmaceuticals, vaccines, fresh food. Readings are tamper-evident and time-stamped by `block.timestamp`. The signed integer allows negative temperatures (frozen goods).
- **Where the code lives:**
  - [SupplyChain.sol:36-41](../hardhat-project/contracts/SupplyChain.sol#L36-L41) — `SensorEntry` struct, with the comment explaining the tenths-of-degree convention.
  - [SupplyChain.sol:43](../hardhat-project/contracts/SupplyChain.sol#L43) — `mapping(uint256 => SensorEntry[]) private sensorReadings`.
  - [SupplyChain.sol:62-68](../hardhat-project/contracts/SupplyChain.sol#L62-L68) — `event SensorReading` with five fields.
  - [SupplyChain.sol:211-227](../hardhat-project/contracts/SupplyChain.sol#L211-L227) — `logSensorReading`. Role check on line 216, humidity sanity check on line 217.
  - [SupplyChain.sol:229-236](../hardhat-project/contracts/SupplyChain.sol#L229-L236) — `getSensorReadings(id)` view.
- **Talking points.** "Solidity has no floats. The tenths trick is the standard EVM workaround — the frontend divides by 10 before plotting. `int256` lets us go negative for frozen-goods telemetry."

### 1.8 Recall System (`issueRecall` / `liftRecall`)

- **What it does.** A manufacturer can flag a product as recalled with a written reason. Once flagged, the recall is visible to anyone — retailers, regulators, end consumers on the verify page. Only the manufacturer role can lift it.
- **Why we used it.** Product safety is the #1 use-case for supply-chain blockchains (FDA traceability, EU Falsified Medicines Directive). The recall must be public and undeletable; the law-of-product-liability says the manufacturer is the right party to issue it.
- **Where the code lives:**
  - [SupplyChain.sol:45-50](../hardhat-project/contracts/SupplyChain.sol#L45-L50) — `RecallEntry` struct.
  - [SupplyChain.sol:52](../hardhat-project/contracts/SupplyChain.sol#L52) — `mapping(uint256 => RecallEntry) public recalls`.
  - [SupplyChain.sol:69-70](../hardhat-project/contracts/SupplyChain.sol#L69-L70) — `ProductRecalled` and `RecallLifted` events.
  - [SupplyChain.sol:238-260](../hardhat-project/contracts/SupplyChain.sol#L238-L260) — `issueRecall`. Manufacturer-only (line 241); reason required (line 243); double-recall blocked (line 244).
  - [SupplyChain.sol:262-278](../hardhat-project/contracts/SupplyChain.sol#L262-L278) — `liftRecall`. Manufacturer-only; only if currently active.
  - [SupplyChain.sol:280-287](../hardhat-project/contracts/SupplyChain.sol#L280-L287) — `getRecall(id)` view.
- **Talking points.** "A distributor seeing a contamination risk can phone the manufacturer, but they cannot issue the public recall themselves — the modifier on line 241 stops them. That mirrors how product-liability law actually works."

### 1.9 Immutable Audit Trail (`HistoryEntry`)

- **What it does.** Every state-changing function appends a `HistoryEntry(actor, action, timestamp)` to a per-product array. The frontend reads this array to render the timeline on the Track page and to populate the audit log.
- **Why we used it.** A chronological, permission-less audit trail is the regulator's primary deliverable. Built into the contract, it cannot be re-ordered, deleted, or back-dated.
- **Where the code lives:**
  - [SupplyChain.sol:18-22](../hardhat-project/contracts/SupplyChain.sol#L18-L22) — `HistoryEntry` struct.
  - [SupplyChain.sol:33](../hardhat-project/contracts/SupplyChain.sol#L33) — the per-product mapping.
  - [SupplyChain.sol:175-177](../hardhat-project/contracts/SupplyChain.sol#L175-L177) — `getHistory(id)` view.
  - **Append sites** (every state change writes here):
    - [SupplyChain.sol:123-127](../hardhat-project/contracts/SupplyChain.sol#L123-L127) — "Product Created"
    - [SupplyChain.sol:140-144](../hardhat-project/contracts/SupplyChain.sol#L140-L144) — "Ownership Transferred"
    - [SupplyChain.sol:155-159](../hardhat-project/contracts/SupplyChain.sol#L155-L159) — "Status Updated"
    - [SupplyChain.sol:198-202](../hardhat-project/contracts/SupplyChain.sol#L198-L202) — "Certification Added"
    - [SupplyChain.sol:253-257](../hardhat-project/contracts/SupplyChain.sol#L253-L257) — "Product Recalled"
    - [SupplyChain.sol:271-275](../hardhat-project/contracts/SupplyChain.sol#L271-L275) — "Recall Lifted"
- **Talking points.** "Every important function has a `history[id].push(...)` near the bottom. That's how the timeline you see on the Track page is built — straight from this array, no off-chain post-processing."

---

## 2. Smart-Contract Tests

- **Where they live.** [hardhat-project/test/SupplyChain.test.ts](../hardhat-project/test/SupplyChain.test.ts).
- **How to run.** From `hardhat-project/`: `npm test`.
- **Coverage breakdown (43 tests, 9 describe blocks):**

| Block | Tests | What it proves |
|---|---|---|
| Deployment | 3 | Admin set, deployer is MANUFACTURER, counter starts at 0 |
| Role Assignment | 4 | Admin can grant; non-admin reverts; NONE forbidden |
| Add Product | 5 | Fields stored, event emitted, role enforced, history written |
| Transfer Ownership | 5 | Owner change, event, zero-address reject, role-validated recipient |
| Update Status | 6 | Sequential transitions, post-SOLD blocked, jumps reverted, non-owner rejected |
| Verify Product | 2 | Real ID returns data; missing ID reverts |
| Read Functions | 3 | `getProduct`, `getHistory` ordering, `getTotalProducts` increment |
| Product Recall | 8 | Issue, lift, role gating, reason required, double-recall blocked |
| IoT Sensor Readings | 6 | Authorised log, role gating, humidity range, missing-product revert |

- **Why mention this in the panel.** A tested contract is a defended contract. If a marker says "how do you know the recall logic works?", you point at `npm test` and the eight Recall cases.

---

## 3. Deployment & Setup Scripts

- **[hardhat-project/hardhat.config.ts](../hardhat-project/hardhat.config.ts)** — Solidity 0.8.20; localhost network at `127.0.0.1:8545`, chainId `31337`. Loads `.env.local` from the frontend directory so the deploy script can write the address back.
- **[hardhat-project/scripts/deploy.ts](../hardhat-project/scripts/deploy.ts)** — Deploys `SupplyChain`, writes `NEXT_PUBLIC_CONTRACT_ADDRESS` into [frontend/.env.local](../frontend/.env.local), exports the ABI to [frontend/public/abi/SupplyChain.json](../frontend/public/abi/SupplyChain.json), and pre-assigns roles to Hardhat accounts #0/#1/#2 (Manufacturer / Distributor / Retailer) so the demo is one command away.
- **[hardhat-project/scripts/assignGroupRoles.ts](../hardhat-project/scripts/assignGroupRoles.ts)** — Reassigns roles to the team's real wallet addresses for the live demo. Reads the deployed contract address from `frontend/.env.local`, attaches, and calls `assignRole` per address.

**Talking points.** "Two scripts intentionally — the first sets up Hardhat-default accounts so the test suite passes, the second lets us swap in our team wallets without redeploying."

---

## 4. Frontend — Pages

All paths below are inside [frontend/](../frontend/).

### 4.1 Dashboard ([app/dashboard/page.tsx](../frontend/app/dashboard/page.tsx))

- **What it does.** Lists products owned by the connected wallet. Stat tiles (Total / In-Transit / Delivered / Sold). Search by name, batch, or origin. Recall badges on each card. Inline button to issue a recall (manufacturers).
- **Why.** Operational hub. The role-coloured hero ribbon and the stat tiles answer "what do I have, and what state is it in?" in two seconds.
- **How it works.**
  - Calls `getTotalProducts()` then loops `getProduct(i)` for each ID and filters by `currentOwner === wallet`.
  - Per-product `getRecall` lookup so the badge can render before the card renders.
  - Memoised stats and search filtering done client-side.
  - Owns an `IssueRecallModal` mounted at the bottom and triggered per card.

### 4.2 Add Product Wizard ([app/add-product/page.tsx](../frontend/app/add-product/page.tsx))

- **What it does.** Three-step wizard (details → certification → review) that submits two transactions: `addProduct`, then `addCertificationHash` if a file was attached.
- **Why.** Splits a complex flow into digestible steps and gives the user a visible upload-progress story ("Uploading to IPFS… anchoring CID on-chain…"). The success screen renders the QR for immediate distribution.
- **How it works.**
  - Role guard at the top — only `MANUFACTURER` can render the page.
  - On submit: send `addProduct` → parse the `ProductAdded` event to get the on-chain ID → POST that ID to `/api/products` so MySQL has the metadata → upload PDF to IPFS via `/api/certifications` → call `addCertificationHash(id, cid, fileName)` → POST the events to `/api/events`.
  - Success screen at [app/add-product/_components/SuccessScreen.tsx](../frontend/app/add-product/_components/SuccessScreen.tsx) — confetti + `<ProductQR />` + Download PNG.

### 4.3 Verify (Public) ([app/verify/page.tsx](../frontend/app/verify/page.tsx))

- **What it does.** Anyone enters a product ID (or scans a QR) and sees the chain-of-custody status, current owner, certification PDF link, and a red recall banner if applicable.
- **Why.** Zero-friction consumer trust. The whole point of the project hinges on this page being walletless.
- **How it works.**
  - [verify/page.tsx:73](../frontend/app/verify/page.tsx#L73) — `const contract = await getContract(false);` — `false` means **no signer**, just a `JsonRpcProvider`. This is the line that makes consumer verification walletless.
  - [verify/page.tsx:38-45](../frontend/app/verify/page.tsx#L38-L45) — reads the `?id=` query parameter so QR codes deep-link straight into a verified result.
  - [verify/page.tsx:47-61](../frontend/app/verify/page.tsx#L47-L61) — `handleDecoded` accepts either a full URL (from a QR) or a raw numeric ID.
  - Pulls product, certifications, and recall in parallel; renders `<RecallBanner />` if `recall.active`.
- **Components used:**
  - [app/verify/_components/AuthenticitySeal.tsx](../frontend/app/verify/_components/AuthenticitySeal.tsx) — animated shield/seal flourish.
  - [app/verify/_components/ScannerFrame.tsx](../frontend/app/verify/_components/ScannerFrame.tsx) — layout wrapper.
  - [components/QRScanner.tsx](../frontend/components/QRScanner.tsx) — html5-qrcode camera + image-upload decoder.

### 4.4 Track Product ([app/track/[id]/page.tsx](../frontend/app/track/[id]/page.tsx))

- **What it does.** The "everything" page. Status progress bar, immutable timeline, sensor chart, certification list, recall banner. Owner-only buttons for Transfer / Update Status / Issue Recall.
- **Why.** The single screen a regulator or auditor would print to a PDF for a compliance file.
- **Sub-components:**
  - [app/track/[id]/_components/HistoryTimeline.tsx](../frontend/app/track/[id]/_components/HistoryTimeline.tsx) — Framer Motion staggered reveal (delay = `0.15 + i * 0.06` per entry); the latest entry pulses.
  - [app/track/[id]/_components/SensorChart.tsx](../frontend/app/track/[id]/_components/SensorChart.tsx) — Recharts dual-axis line chart; converts `temperature / 10` for display.
  - [app/track/[id]/_components/StatusProgressBar.tsx](../frontend/app/track/[id]/_components/StatusProgressBar.tsx) — visual `CREATED → SOLD` indicator.
  - [components/ProductQR.tsx](../frontend/components/ProductQR.tsx) — QR canvas + Download PNG.

### 4.5 Audit (Regulator View) ([app/audit/page.tsx](../frontend/app/audit/page.tsx))

- **What it does.** Filterable, sortable table of every event in the system. Donut chart of event-type counts. CSV export. Filter state lives in the URL so a regulator can paste a link and a colleague sees the exact same view.
- **Why.** Compliance dashboard. Five filter dimensions (Product ID, Batch, From, To, Action) cover almost every "find the smoking gun" investigation.
- **How it works.**
  - Reads `/api/events` — the MySQL mirror of the on-chain history. Mirror, not source — chain is authoritative.
  - URL-serialised filters via `next/navigation`.
  - Sub-components: [_components/FilterBar.tsx](../frontend/app/audit/_components/FilterBar.tsx), [_components/AuditTable.tsx](../frontend/app/audit/_components/AuditTable.tsx), [_components/StatusDonut.tsx](../frontend/app/audit/_components/StatusDonut.tsx), [_components/ExportButton.tsx](../frontend/app/audit/_components/ExportButton.tsx).

### 4.6 Contacts (Address Book) ([app/contacts/page.tsx](../frontend/app/contacts/page.tsx))

- **What it does.** Saves wallet addresses with names + roles in MySQL. Used by the Transfer Ownership modal so users don't type 42-character hex strings.
- **Why.** Pure UX win. Doesn't bypass on-chain RBAC — the smart contract still verifies the recipient role on transfer. But it removes the biggest friction point in the day-to-day flow.
- **Components:** [_components/ContactForm.tsx](../frontend/app/contacts/_components/ContactForm.tsx), [_components/ContactRow.tsx](../frontend/app/contacts/_components/ContactRow.tsx).

### 4.7 IoT Simulator ([app/iot-simulator/page.tsx](../frontend/app/iot-simulator/page.tsx))

- **What it does.** Manual form — pick product, enter °C and humidity, submit. Hits `logSensorReading(productId, temp * 10, humidity)`. Shows the latest readings table.
- **Why.** Stand-in for the real IoT gateway. In production, an embedded device with a funded wallet would call this every minute. The signed transaction is identical; the contract cannot tell a human from a sensor.
- **Implementation note.** The temperature input is multiplied by 10 before sending — that's the client side of the tenths-of-degree convention defined in [SupplyChain.sol:37](../hardhat-project/contracts/SupplyChain.sol#L37).

---

## 5. Frontend — Modals & Reusable Components

All in [frontend/components/](../frontend/components/).

### 5.1 [WalletConnect.tsx](../frontend/components/WalletConnect.tsx)
- **What.** Connect button → MetaMask prompt. On first connect, shows a registration modal (company name + role) that POSTs to `/api/users`. Listens to `accountsChanged` so switching wallets in MetaMask updates the app instantly.
- **Why.** Single component owns the entire identity bridge — no scattered wallet logic across pages.

### 5.2 [Navbar.tsx](../frontend/components/Navbar.tsx)
- **What.** Sticky header. Nav links are filtered by the user's on-chain role (e.g. "Add Product" hidden from non-manufacturers). Animated active-route pill via Framer Motion `layoutId="nav-pill"`. Mobile drawer.
- **Why.** Role-aware navigation prevents users from even attempting actions the contract would revert. Less confusion, fewer wasted gas estimates.

### 5.3 [TransferOwnershipModal.tsx](../frontend/components/TransferOwnershipModal.tsx) + [ContactPicker.tsx](../frontend/components/ContactPicker.tsx)
- **What.** Two-tab UI: "Pick from contacts" (dropdown filled by `/api/contacts`) or "Enter new address" (manual hex with optional save-as-contact checkbox).
- **Why.** Combines the speed of a dropdown with the flexibility of a manual entry. The `allowRoles` prop on `ContactPicker` is wired so a future enhancement can restrict the picker to, say, distributors only — enforcing supply-chain direction in the UI.

### 5.4 [UpdateStatusModal.tsx](../frontend/components/UpdateStatusModal.tsx)
- **What.** Confirmation dialog showing only the legal next status (current + 1).
- **Why.** Mirrors the contract's sequential check ([SupplyChain.sol:151](../hardhat-project/contracts/SupplyChain.sol#L151)) in the UI so the user never even sees an invalid choice.

### 5.5 [IssueRecallModal.tsx](../frontend/components/IssueRecallModal.tsx)
- **What.** Branches on `isRecalled` prop. If false: shows reason textarea + red "Issue Recall" button → calls `issueRecall`. If true: shows a "Lift Recall" confirmation → calls `liftRecall`.
- **Why.** One modal, two life-cycle states — keeps the manufacturer's mental model simple.

### 5.6 [RecallBanner.tsx](../frontend/components/RecallBanner.tsx)
- **What.** Red banner with reason + issuer (shortened address) + timestamp. Slides in via Framer Motion. Renders on both the Track page and the public Verify page when `recall.active` is true.
- **Why.** Public, prominent, undismissible. The whole point of an on-chain recall is that it cannot be hidden.

### 5.7 [ProductQR.tsx](../frontend/components/ProductQR.tsx)
- **What.** Generates a QR code encoding `/verify?id=N` on a `<canvas>`. Includes a Download PNG link.
- **Why.** The bridge between the physical product (printed QR on packaging) and the on-chain record. Anyone with a phone camera completes the round trip.

### 5.8 [QRScanner.tsx](../frontend/components/QRScanner.tsx)
- **What.** Wraps `html5-qrcode` for camera scanning, plus a "Upload image" tab for the demo (so we can use a downloaded PNG without needing a working webcam).
- **Why.** Robust demo behaviour — the camera tab is the real flow, the upload tab is the failsafe.

### 5.9 [ThemeSwitcher.tsx](../frontend/components/ThemeSwitcher.tsx) + [lib/theme.tsx](../frontend/lib/theme.tsx)
- **What.** Three themes (Nebula / Aurora / Obsidian) implemented as CSS classes on `<html>`. Each theme overrides CSS custom properties (`--sig-1`, `--text-primary`, etc.) so a single class change repaints the entire UI with no React re-render. Choice persisted to `localStorage`.
- **Why.** Production-ready polish, A+-band evidence. Costs almost no runtime overhead.

### 5.10 Other supporting components
- [ProductCard.tsx](../frontend/components/ProductCard.tsx) — product summary tile with status badge, recall pill, action buttons.
- [StatTile.tsx](../frontend/components/StatTile.tsx) — coloured metric tile for the dashboard hero row.
- [EventFeed.tsx](../frontend/components/EventFeed.tsx) — live event stream rendered on the dashboard.
- [StatusBadge.tsx](../frontend/components/StatusBadge.tsx) — coloured pill for product status.
- [EmptyState.tsx](../frontend/components/EmptyState.tsx) — placeholder UI for empty lists.
- [AuroraBackground.tsx](../frontend/components/AuroraBackground.tsx) — animated gradient blobs behind the app shell.
- [ProductCardSkeleton.tsx](../frontend/components/ProductCardSkeleton.tsx) — loading placeholder.
- [components/ui/](../frontend/components/ui/) — primitives: `Button`, `Input`, `Label`, `Select`, `Textarea`, `Modal`, `FileDropzone`, `Skeleton`, `Toast`.

---

## 6. Frontend — API Routes

All in [frontend/app/api/](../frontend/app/api/).

### 6.1 [/api/certifications/route.ts](../frontend/app/api/certifications/route.ts) (POST)
- **What.** Receives a multipart file upload, pipes it to the local IPFS daemon via `kubo-rpc-client` (`ipfs.add({ cidVersion: 1, pin: true })`), returns `{ cid, fileName }`.
- **Why.** The browser cannot directly POST to the IPFS daemon — CORS and auth would both fail. The Next.js route is the trusted proxy.

### 6.2 [/api/contacts/route.ts](../frontend/app/api/contacts/route.ts) + [[id]/route.ts](../frontend/app/api/contacts/[id]/route.ts) (GET / POST / PATCH / DELETE)
- **What.** CRUD over the MySQL `contacts` table. UPSERTs on POST. Validates hex addresses; refuses self-contacts.
- **Why.** Contacts are operationally sensitive (they reveal commercial relationships) and change frequently — neither characteristic suits on-chain storage.

### 6.3 [/api/events/route.ts](../frontend/app/api/events/route.ts) (GET / POST)
- **What.** GET returns event-log rows joined with product batch numbers (so the audit page can filter by batch). POST accepts either `product_id` (DB) or `chain_product_id` (blockchain) and writes a row.
- **Why.** Convenience index. The blockchain remains the source of truth — if MySQL is wiped, the table can be rebuilt by replaying contract event logs.

### 6.4 [/api/products/route.ts](../frontend/app/api/products/route.ts) + [[id]/route.ts](../frontend/app/api/products/[id]/route.ts) (GET / POST)
- **What.** Stores human-readable metadata (`name`, `description`, `origin_country`, `batch_number`) keyed by `chain_product_id`.
- **Why.** The on-chain `Product` struct deliberately omits a description field (gas). MySQL fills the gap for searchability and richer presentation.

### 6.5 [/api/users/route.ts](../frontend/app/api/users/route.ts) (GET / POST)
- **What.** Registers users on first wallet connect (company name + cached role). GET returns the cached row; 404 means "not registered yet, show the sign-up modal".
- **Why.** Lets the navbar show "Acme Pharma — MANUFACTURER" instantly without paying a contract call. The on-chain `roles` mapping remains the authority for any actual write.

---

## 7. Frontend — Utility Libraries

All in [frontend/lib/](../frontend/lib/).

### 7.1 [contract.ts](../frontend/lib/contract.ts)
- **`getContract(withSigner)`** — [contract.ts:25-49](../frontend/lib/contract.ts#L25-L49). The single chokepoint for blockchain access. With a signer it uses MetaMask (`BrowserProvider`); without, it uses `JsonRpcProvider` (read-only, no wallet). Loads the ABI from `public/abi/SupplyChain.json`.
- **`connectWallet()`** — [contract.ts:51-87](../frontend/lib/contract.ts#L51-L87). Asks MetaMask for permissions and accounts. Has explicit error branches for "request already pending" (-32002) and "user rejected" (4001).
- **`shortenAddress(addr)`** — [contract.ts:89-94](../frontend/lib/contract.ts#L89-L94). The `0xAbCd…1234` formatter used everywhere.
- **`statusIndexToString(i)`** — [contract.ts:96-110](../frontend/lib/contract.ts#L96-L110). Converts the on-chain enum index back into a TypeScript-friendly string literal.

### 7.2 [ipfs.ts](../frontend/lib/ipfs.ts)
- `gatewayUrl(cid)` — local gateway URL (`127.0.0.1:8080/ipfs/CID`).
- `publicGatewayUrl(cid)` — fallback `ipfs.io/ipfs/CID`.
- `uploadToIPFS(file)` — POSTs to `/api/certifications` and returns `{ cid, fileName }`.

### 7.3 [db.ts](../frontend/lib/db.ts)
- mysql2 connection pool initialised from env vars.
- `query<T>(sql, params)` — typed wrapper.
- `createTables()` runs at module load and idempotently provisions `users`, `products`, `events_log`, `contacts`.

### 7.4 [types.ts](../frontend/lib/types.ts)
- `Product`, `ProductStatus`, `UserRole`, `Contact`, `DbProduct`, `RecallEntry`, `SensorEntry`. Single shared type vocabulary used across pages, components, and API routes.

### 7.5 [theme.tsx](../frontend/lib/theme.tsx)
- React context for the active theme; toggles a class on `<html>` and persists to `localStorage`.

### 7.6 [WalletContext.tsx](../frontend/lib/WalletContext.tsx)
- React context exposing `{ address, role, isConnected, companyName }` plus a `disconnect()` action.

---

## 8. Why This Hybrid Architecture? (one-paragraph defence)

Each storage layer is doing only what it is uniquely good at:

- **Blockchain** — tamper-evident facts that *must* be undeniable: who owns the product right now, what status it's in, what its certification CIDs are, whether it's recalled, what the sensor said at time T.
- **IPFS** — bulk content (PDFs, images) addressed by hash so that the content is its own integrity proof. Cheap, content-addressable, decentralised.
- **MySQL** — everything that is convenience-only and reconstructible: human-readable names, contact lists, fast filterable event index. If it disappeared, the chain replay would rebuild it.

If a marker pushes back with "why not put everything on-chain?", the answer is gas: ~68 k gas/KB of calldata, so a 1 MB PDF costs thousands of dollars on mainnet. If they push back with "why not skip the chain entirely?", the answer is trust: a centralised database can be edited silently, a blockchain cannot.

---

## 9. Demo Cheat Sheet (mapped to feature sections)

The 13-step demo from [PRESENTATION.md](../PRESENTATION.md) collapsed into "if they ask, point here":

| Step | What you do | Feature section in this guide |
|---|---|---|
| 1 | Open Dashboard, connect Manufacturer wallet | §4.1 + §1.1 |
| 2 | Add Product wizard, two transactions | §4.2 + §1.2 + §1.6 |
| 3 | Download QR PNG | §5.7 |
| 4 | Disconnect → Verify by ID | §4.3 + §1.5 |
| 5 | Scan QR (upload tab) | §5.8 |
| 6 | Track page timeline + status bar | §4.4 + §1.9 + §1.3 |
| 7 | Click IPFS gateway link | §1.6 |
| 8 | Audit page with two filters + share URL | §4.5 + §6.3 |
| 9 | Add a contact | §4.6 + §6.2 |
| 10 | Transfer Ownership using saved contact | §5.3 + §1.4 |
| 11 | IoT Simulator → temp 245, humidity 72 | §4.7 + §1.7 |
| 12 | Issue Recall → red banner appears on Verify | §5.5 + §5.6 + §1.8 |
| 13 | Lift Recall, then switch theme to Aurora | §1.8 + §5.9 |

---

## 10. Likely Q&A → File Pointer Table

Quick lookup for "where exactly is that?" questions:

| Question | Answer (file:line) |
|---|---|
| Where is the role check? | [SupplyChain.sol:72-75](../hardhat-project/contracts/SupplyChain.sol#L72-L75) |
| Why can't a retailer mark a product SOLD before DELIVERED? | [SupplyChain.sol:151](../hardhat-project/contracts/SupplyChain.sol#L151) |
| Why is temperature stored as `int256`? | [SupplyChain.sol:36-41](../hardhat-project/contracts/SupplyChain.sol#L36-L41) (comment on line 37) |
| Where is the IPFS hash stored? | [SupplyChain.sol:24-29](../hardhat-project/contracts/SupplyChain.sol#L24-L29) (struct), [SupplyChain.sol:191-196](../hardhat-project/contracts/SupplyChain.sol#L191-L196) (push) |
| Why can only manufacturers issue a recall? | [SupplyChain.sol:241](../hardhat-project/contracts/SupplyChain.sol#L241) |
| How does the consumer verify without a wallet? | [verify/page.tsx:73](../frontend/app/verify/page.tsx#L73) — `getContract(false)` builds a `JsonRpcProvider`-backed instance |
| Where is `getContract` implemented? | [contract.ts:25-49](../frontend/lib/contract.ts#L25-L49) |
| Where is the upload to IPFS handled server-side? | [/api/certifications/route.ts](../frontend/app/api/certifications/route.ts) |
| Where is the audit log filtered? | [app/audit/page.tsx](../frontend/app/audit/page.tsx) + [_components/FilterBar.tsx](../frontend/app/audit/_components/FilterBar.tsx) |
| Where is the QR encoded? | [components/ProductQR.tsx](../frontend/components/ProductQR.tsx) |
| Where is the QR decoded? | [components/QRScanner.tsx](../frontend/components/QRScanner.tsx) |
| Where do the navbar links get filtered by role? | [components/Navbar.tsx](../frontend/components/Navbar.tsx) |
| Where do the themes change colours? | [lib/theme.tsx](../frontend/lib/theme.tsx) + CSS variables in [app/globals.css](../frontend/app/globals.css) |
| Where is the test suite? | [hardhat-project/test/SupplyChain.test.ts](../hardhat-project/test/SupplyChain.test.ts) |
| Where do I run the deploy? | `npm run deploy` inside `hardhat-project/` → [scripts/deploy.ts](../hardhat-project/scripts/deploy.ts) |
| Where is each role granted? | [scripts/assignGroupRoles.ts](../hardhat-project/scripts/assignGroupRoles.ts) (live demo) or [scripts/deploy.ts](../hardhat-project/scripts/deploy.ts) (defaults) |

---

## 11. One-Sentence Defences You Can Memorise

- **"How is this tamper-evident?"** — Every state change is signed by a wallet's private key and recorded by the EVM; rewriting it would require rewriting the chain.
- **"Why hybrid storage?"** — Gas. 1 MB on-chain ≈ thousands of dollars; the same MB on IPFS is free, with the on-chain CID providing the integrity proof.
- **"How do consumers participate?"** — They scan a QR, the page calls `verifyProduct` with a `JsonRpcProvider`, and the chain answers without any wallet, sign-in, or gas.
- **"How do you stop a retailer impersonating the manufacturer?"** — `onlyRole(MANUFACTURER)` reads `roles[msg.sender]`, and `msg.sender` is set by the EVM from the transaction signature — un-spoofable.
- **"How do you know it works?"** — 43 tests covering deployment, RBAC, products, transfers, status, verification, certifications, recalls, and IoT, all green via `npm test`.
