# Supply Chain DApp — Group 13

**CT124-3-3-BCD Blockchain Development · Asia Pacific University**

A full-stack, role-based supply chain tracking application built on Ethereum. Every product journey — from manufacturing to final sale — is written permanently to a blockchain. Anyone can verify product authenticity by scanning a QR code, with no crypto wallet required.

| Name | TP Number |
|---|---|
| NOOR KHALIL ABDULLAH KHALED | TP078880 |
| TAHA FAHD AHMED MOHAMMED THABIT | TP078281 |
| ABUBAKER ELSIDDIG TAGELDEEN SIDDIG | TP078003 |
| MUHMMAD AHMED KHAN | TP069769 |

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture](#architecture)
3. [Roles](#roles)
4. [Full Setup Guide](#full-setup-guide)
5. [Starting the App (Every Session)](#starting-the-app-every-session)
6. [Feature Walkthrough](#feature-walkthrough)
   - [Connect Wallet & Register](#1-connect-wallet--register)
   - [Dashboard](#2-dashboard)
   - [Add Product](#3-add-product)
   - [Track Product](#4-track-product)
   - [Transfer Ownership](#5-transfer-ownership)
   - [Update Status](#6-update-status)
   - [Verify Product (Public)](#7-verify-product-public)
   - [Audit Log](#8-audit-log)
   - [IoT Sensor Simulator](#9-iot-sensor-simulator)
   - [Product Recall](#10-product-recall)
   - [Contacts Address Book](#11-contacts-address-book)
   - [Theme Switcher](#12-theme-switcher)
7. [Hardhat Test Accounts](#hardhat-test-accounts)
8. [Smart Contract Functions](#smart-contract-functions)
9. [API Reference](#api-reference)
10. [Known Limitations](#known-limitations)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.20, Hardhat, ethers v6 |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Animations | Framer Motion, Lucide React |
| Off-chain Storage | MySQL (metadata + events), IPFS / Kubo (certificates) |
| Wallet | MetaMask |

---

## Architecture

```
User Layer        Manufacturer · Distributor · Retailer · Regulator · Public · IoT
                        │
Application Layer  Next.js Frontend  ──── /api/* Routes ──── MySQL
                        │
Blockchain Layer   SupplyChain.sol on Hardhat Node (Chain ID 31337)
                        │
Storage Layer      IPFS (Kubo local daemon) — certificates anchored on-chain by CID
```

---

## Roles

| Role | What they can do |
|---|---|
| **MANUFACTURER** | Add products, upload certificates to IPFS, issue/lift recalls, transfer to Distributor |
| **DISTRIBUTOR** | Accept ownership, update status to IN_TRANSIT, log IoT sensor readings, transfer to Retailer |
| **RETAILER** | Accept ownership, update status to DELIVERED or SOLD, log IoT sensor readings |
| **REGULATOR** | Read-only access to the full audit log and all product histories |
| **Public** | Verify any product by ID or QR code — no wallet needed |

---

## Full Setup Guide

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [MetaMask browser extension](https://metamask.io)
- [XAMPP](https://www.apachefriends.org) (for MySQL) or any MySQL 8 instance
- [IPFS Kubo](https://docs.ipfs.tech/install/command-line/) (for certificate uploads)

### Step 1 — Clone and install dependencies

```bash
# Install Hardhat dependencies
cd hardhat-project
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2 — Set up MySQL

Start MySQL (via XAMPP or any MySQL 8 service), then run the following SQL:

```sql
CREATE DATABASE IF NOT EXISTS supplychain;
USE supplychain;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL UNIQUE,
  name VARCHAR(255),
  batch_number VARCHAR(100),
  description TEXT,
  origin VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  actor_address VARCHAR(42),
  action VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL,
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 3 — Configure environment

Create `frontend/.env.local` (the deploy script will auto-update `NEXT_PUBLIC_CONTRACT_ADDRESS`):

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=supplychain
```

### Step 4 — Start IPFS (for certificate uploads)

```bash
ipfs init        # only needed once
ipfs daemon      # keep this running
```

### Step 5 — Start the Hardhat node and deploy

```bash
cd hardhat-project
npx hardhat node
```

In a second terminal:

```bash
cd hardhat-project
npx hardhat run scripts/deploy.ts --network localhost
```

The deploy script automatically updates `frontend/.env.local` with the new contract address and writes the ABI to `frontend/public/abi/SupplyChain.json`.

### Step 6 — Assign roles to test wallets

```bash
cd hardhat-project
npx hardhat run scripts/assignGroupRoles.ts --network localhost
```

### Step 7 — Start the frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Starting the App (Every Session)

The Hardhat node stores everything in memory — restarting it wipes all deployed contracts. Every session requires:

1. Start MySQL (XAMPP or service)
2. Start IPFS: `ipfs daemon`
3. **Double-click `hardhat-project/start-local.bat`** — this opens the node and deploys in one step
4. Assign roles: `npx hardhat run scripts/assignGroupRoles.ts --network localhost`
5. Start frontend: `cd frontend && npm run dev`

> After each deploy the contract address changes. The `.env.local` is updated automatically but the Next.js dev server must be restarted to pick it up.

---

## Feature Walkthrough

### 1. Connect Wallet & Register

1. Open MetaMask and switch to the **Localhost 8545** network (Chain ID: 31337).
2. Import a test account using a private key from the Hardhat node output (see [Hardhat Test Accounts](#hardhat-test-accounts)).
3. Click **Connect Wallet** in the navbar.
4. If this wallet has never connected before, a **Register User** modal appears.
5. Enter your **Company Name** and select your **Role** (must match the role assigned by `assignGroupRoles.ts`).
6. Click **Register**. Your company name and role badge will appear immediately in the navbar and on the dashboard.

> The role you select in the registration form is for display purposes. The actual on-chain permissions come from the `assignGroupRoles.ts` script. Make sure they match.

---

### 2. Dashboard

After connecting, the dashboard shows:

- **Company name** as the page heading
- **Role badge** (colour-coded: violet = Manufacturer, amber = Distributor, green = Retailer)
- **Stat tiles** — Total products owned, In Transit, Delivered, Sold
- **Live Event Feed** — real-time blockchain events as they happen
- **Your Products** — all products currently owned by this wallet, with search

---

### 3. Add Product

> Only available to **MANUFACTURER** role.

1. Click **Add Product** in the navbar.
2. **Step 1 — Product Details:** Fill in Product Name, Batch Number, Origin, and Description.
3. **Step 2 — Upload Certificate:** Drop a PDF or image certificate file. It is uploaded to IPFS and the returned CID is anchored on-chain via `addCertificationHash`.
4. **Step 3 — Review:** Confirm all details.
5. Click **Submit**. MetaMask opens — approve the transaction.
6. On success: a confetti animation plays and a **QR code** is generated linking to the product's public verification page (`/verify?id=<n>`).
7. Right-click the QR code to download it as a PNG for printing on packaging.

---

### 4. Track Product

Any connected wallet can visit `/track/<productId>` to see the full product page:

- **Recall Banner** — red alert at the top if the product is currently recalled
- **Product header** — name, batch, origin, current owner, status progress bar
- **History Timeline** — every on-chain event (created, transferred, status change, recall issued/lifted)
- **Sensor Chart** — line chart of all IoT temperature and humidity readings
- **QR Code** — scannable link to the public verify page
- **IPFS certificate link** — opens the certificate from the local IPFS gateway
- **Transfer button** (owner only) — opens the Transfer Ownership modal
- **Update Status button** (owner only) — advances the product one step in the lifecycle
- **Issue Recall / Lift Recall button** (MANUFACTURER only)

---

### 5. Transfer Ownership

> The current owner can transfer to any wallet that has a valid on-chain role.

1. On the dashboard or track page, click **Transfer**.
2. The **Transfer Ownership Modal** opens with two tabs:
   - **Pick from contacts** — choose a saved contact from the dropdown
   - **Enter new address** — type a 42-character `0x` address manually, with an option to save it to your contacts
3. Select or enter the recipient address.
4. Click **Transfer**. MetaMask opens — approve the transaction.
5. The product disappears from your dashboard and appears on the recipient's dashboard.

> The recipient must already have a role assigned on-chain. Transfers to wallets with no role will be rejected by the smart contract.

---

### 6. Update Status

> Only the current owner can update status. Status advances one step at a time.

| From | To | Who |
|---|---|---|
| CREATED | IN_TRANSIT | Distributor |
| IN_TRANSIT | DELIVERED | Retailer |
| DELIVERED | SOLD | Retailer |
| SOLD | — | Terminal state, no further updates |

1. On the track page or dashboard, click **Update Status**.
2. The modal shows the next available status.
3. Approve in MetaMask. The timeline and progress bar update instantly.

---

### 7. Verify Product (Public)

> No wallet required. Anyone can use this page.

1. Go to `/verify`.
2. Enter a product ID, or click **Scan QR** and upload a QR code PNG from the **Upload** tab.
3. The product's name, owner, status, and authenticity seal appear.
4. If the product is currently recalled, a **red recall banner** appears above the seal.
5. Click **View Full History** to go to the track page.

---

### 8. Audit Log

> Accessible to all connected wallets. Best used by the **REGULATOR** role.

1. Click **Audit** in the navbar.
2. The full event log shows every supply-chain action across all products, ordered newest first.
3. **Filters:** narrow by Product ID, Batch Number, Action type, or date range.
4. **Donut chart** shows the distribution of event types visually.
5. Click **Export CSV** to download the filtered results.

> The audit log reads from the MySQL `events_log` table. It is populated automatically when products are added, transferred, or have their status updated.

---

### 9. IoT Sensor Simulator

> Available to **DISTRIBUTOR** and **RETAILER** roles.

1. Click **IoT Simulator** in the navbar.
2. Enter the **Product ID** you currently own.
3. Set **Temperature** (°C), **Humidity** (%), and **Location** string.
4. Click **Submit Reading**. MetaMask opens — approve the transaction.
5. Navigate to the track page for that product — the sensor chart updates with the new reading.

All readings are stored entirely on-chain in a `SensorEntry` struct array. No database is involved.

---

### 10. Product Recall

> Issue and lift recalls: **MANUFACTURER** only. Recall banners are visible to everyone.

**Issue a recall:**
1. On the dashboard (product card) or the track page, click **Issue Recall**.
2. Enter a reason (e.g., "Contamination detected in batch B-204").
3. Approve in MetaMask.
4. A red **PRODUCT RECALLED** banner immediately appears on the track page and the verify page.
5. The product card on the dashboard shows a red **RECALLED** badge.

**Lift a recall:**
1. On the same product, click **Lift Recall**.
2. Confirm in the modal and approve in MetaMask.
3. The banner disappears. The full issue-and-lift history remains permanently on the product timeline.

---

### 11. Contacts Address Book

1. Click **Contacts** in the navbar.
2. Click **Add Contact** — enter a wallet address, name, and role.
3. Saved contacts appear in the **Transfer Ownership** modal under "Pick from contacts".
4. Contacts can be edited or deleted from the contacts page.
5. Contacts are stored in MySQL per wallet — they are display metadata only; the blockchain record of ownership is authoritative.

---

### 12. Theme Switcher

Click the palette icon in the navbar to switch between three themes:

| Theme | Colours |
|---|---|
| **Nebula** (default) | Violet / Indigo / Cyan with animated aurora background |
| **Aurora** | Mint / Sky / Violet |
| **Obsidian** | Monochrome / Bronze |

All colours are CSS custom properties (`var(--sig-1)`, `var(--role-mfr)`, etc.). Switching a theme changes one class on `<html>` — no component has a hardcoded colour.

---

## Hardhat Test Accounts

The Hardhat node generates 20 deterministic accounts from a fixed mnemonic. The `assignGroupRoles.ts` script assigns:

| Index | Address | Role |
|---|---|---|
| 0 | `0xf39F...2266` | Contract Owner (admin) |
| 1 | `0x70997...79C8` | MANUFACTURER |
| 2 | `0x3C44...93BC` | DISTRIBUTOR |
| 3 | `0x90F7...b906` | RETAILER |
| 4 | `0x15d3...522F` | REGULATOR |

Private keys are printed in the terminal when `npx hardhat node` starts. Import them into MetaMask using **Import Account → Private Key**.

---

## Smart Contract Functions

| Function | Access | Description |
|---|---|---|
| `addProduct(name, batch, origin, desc)` | MANUFACTURER | Register a new product on-chain |
| `getProduct(id)` | Public | Read product details |
| `getTotalProducts()` | Public | Total number of products |
| `transferOwnership(id, newOwner)` | Current owner | Transfer product to a new wallet |
| `updateStatus(id, newStatus)` | Current owner | Advance status one step |
| `addCertificationHash(id, cid)` | MANUFACTURER | Anchor an IPFS CID on-chain |
| `getHistory(id)` | Public | Full on-chain history timeline |
| `verifyProduct(id)` | Public | Read-only product verification |
| `logSensorReading(id, temp, humidity, location)` | DISTRIBUTOR / RETAILER | Store an IoT reading on-chain |
| `getSensorReadings(id)` | Public | All sensor readings for a product |
| `issueRecall(id, reason)` | MANUFACTURER | Issue a product recall |
| `liftRecall(id)` | MANUFACTURER | Lift an active recall |
| `getRecall(id)` | Public | Get the current recall status |
| `assignRole(wallet, role)` | Contract Owner | Grant a role to a wallet |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products?wallet=<addr>` | Products owned by a wallet |
| POST | `/api/products` | Save product metadata to MySQL |
| GET | `/api/events` | All events (audit log) |
| GET | `/api/events?product_id=<n>` | Events for a single product |
| POST | `/api/events` | Log an event |
| GET | `/api/contacts?wallet=<addr>` | Saved contacts for a wallet |
| POST | `/api/contacts` | Create or update a contact |
| PATCH | `/api/contacts/[id]` | Update contact name / role / notes |
| DELETE | `/api/contacts/[id]` | Delete a contact |
| GET | `/api/users?wallet=<addr>` | Look up a registered user |
| POST | `/api/users` | Register a new user (company name + role) |

---

## Known Limitations

- **Local Hardhat node only.** Every restart wipes all contracts — redeploy and reassign roles each session. Use `start-local.bat` to automate this.
- **IPFS local daemon.** Certificates are pinned to a local Kubo node. In production, use a pinning service (Pinata, Filebase) for redundancy.
- **MySQL required.** The audit log, contacts, and user registration all depend on MySQL. If MySQL is unavailable, blockchain features still work but the audit log and contacts will be empty.
- **IoT readings are manual.** The simulator page submits readings via MetaMask. In production, a gateway process would sign transactions on behalf of hardware devices.
