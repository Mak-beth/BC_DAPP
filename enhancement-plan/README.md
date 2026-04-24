# Enhancement Plan — Supply Chain DApp, Group 13

CT124-3-3-BCD Blockchain Development · Part 2 enhancement pack.

This folder is a **sequential execution plan** for an AI coder. Each numbered file is a self-contained task. Hand them over **one at a time**. Do not let the coder read ahead.

---

## Prerequisites & Environment Setup

Before starting the enhancement phases, ensure your local environment is configured:

### 1. Local Database Setup (MySQL)
To run the Next.js frontend, you need a local MySQL instance.
- **Option 1: XAMPP (Easiest)**: Download **XAMPP for Windows** from [apachefriends.org](https://www.apachefriends.org/). Open the XAMPP Control Panel and **Start** both **Apache** and **MySQL**. Your database user will be `root` with a blank password.
- **Option 2: Official MySQL Installer**: Download from [dev.mysql.com](https://dev.mysql.com/downloads/installer/) and set a root password during installation.

Once MySQL is running, open `phpMyAdmin` (via XAMPP) or your MySQL client, go to the **SQL** tab, and run `CREATE DATABASE supplychain;`. Ensure your `frontend/.env.local` matches these credentials (`DB_USER=root`, `DB_PASSWORD=`).

### 2. Wallet Setup (MetaMask)
To interact with the local blockchain, you need a crypto wallet:
1. Install the **MetaMask** browser extension.
2. Open MetaMask and add a custom network:
   - **Network Name:** Hardhat Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** ETH
3. When you run the local blockchain (`npx hardhat node`), it will print 20 test accounts with private keys. Copy the **Private Key for Account #0**.
4. In MetaMask, click your account icon, select **Import Account**, and paste the private key. This account will automatically hold the `MANUFACTURER` role.

---

## 🚀 User Guide: Navigating Roles & Wallets

The Supply Chain DApp uses **Role-Based Access Control (RBAC)**. Your interface and available actions change depending on which MetaMask account you have selected.

### 1. The "Big Three" Test Accounts
To fully test the system, import these three accounts into MetaMask from your `npx hardhat node` terminal output:

| Account Index | Default Role | Actions You Can Perform |
| :--- | :--- | :--- |
| **Account #0** | **MANUFACTURER** | Create products, add certifications, transfer to Distributor. |
| **Account #1** | **DISTRIBUTOR** | Receive products, update status to "In Transit", transfer to Retailer. |
| **Account #2** | **RETAILER** | Receive products, update status to "Delivered" or "Sold". |
| **Account #3+** | **NONE** | View-only access. Can verify products but cannot perform actions. |

### 2. How to Switch Roles
1.  Open **MetaMask**.
2.  Click the circular account icon at the top right.
3.  Select the account you want to use (e.g., Account #1 for Distributor).
4.  The DApp will automatically detect the change. The "Role" badge in the Navbar will update, and different buttons (like "Add Product" or "Transfer") will appear/disappear.

### 3. Role-Specific Workflow
*   **Manufacturer:** Go to the "Add Product" page to mint a new item on the blockchain.
*   **Distributor/Retailer:** Go to the "Dashboard" or "Contacts" to see items you own or are transferring to you.
*   **Public/Customer:** Use the "Verify" page to scan a QR code and check the product's authenticity without needing a role.

### 4. Troubleshooting
*   **"Wrong Network" Banner:** Ensure MetaMask is set to **Hardhat Local** (Chain ID 31337).
*   **Transaction "Nonce" Errors:** If you restart your hardhat node, MetaMask might get confused. Go to *Settings > Advanced > Clear activity tab data* in MetaMask to reset it.
*   **Buttons not appearing:** Ensure you have the correct role and are the **current owner** of the product you are trying to modify.

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
| 21 | `21_phase-contacts-and-transfer.md` | Address book (contacts CRUD) + Transfer Ownership / Update Status actions | |
| 22 | `22_phase-theme-overhaul.md` | Distinctive palette, aurora background, theme switcher (Nebula / Aurora / Obsidian), role-tinted surfaces | |
| 23 | `23_phase-iot-simulation.md` | **IoT sensor simulation** — `logSensorReading` on-chain, sparkline chart on track page | ✅ |
| 24 | `24_phase-recall-system.md` | **Product Recall System** — `issueRecall`/`liftRecall` on-chain, red banner on verify + track | ✅ |
| 25 | `25_phase-event-feed.md` | Live blockchain event feed on dashboard — real-time ethers event listeners | |

Phases 15, 16, 17 are marked "proposal parity" — they exist because Part 1 promised these features. Do not skip them.

Phases 21 and 22 were added after an initial review — 21 makes transfer-ownership usable in one click, 22 replaces the generic indigo/cyan defaults with a designed colour system.

Phases 23, 24, 25 were added to maximise marks — 23 closes the Part 1 §5.4 IoT promise, 24 adds on-chain governance (recall system), 25 makes the blockchain visibly live during the demo. Phases 23 and 24 modify the contract — redeploy after each.

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
