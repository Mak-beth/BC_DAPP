# Supply Chain DApp — Group 13
**CT124-3-3-BCD Blockchain Development**

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Setup Instructions](#3-setup-instructions)
4. [Smart Contract Overview](#4-smart-contract-overview)
5. [System Features](#5-system-features)
6. [How to Use Each Page](#6-how-to-use-each-page)
7. [API Reference](#7-api-reference)
8. [Architecture Decisions](#8-architecture-decisions)

---

## 1. System Overview

This DApp implements a blockchain-based supply chain tracking system. Manufacturers register products on-chain, and distributors/retailers transfer ownership and update product status as it moves through the supply chain. Anyone can verify a product's authenticity and view its full history without a wallet.

The system combines:
- **Ethereum smart contract** (Hardhat/Solidity) as the authoritative source of truth for ownership and status
- **MySQL database** to store off-chain metadata (descriptions, origin country) and support faster queries
- **Next.js frontend** to provide a user-friendly interface connected to both layers via MetaMask

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.20, Hardhat |
| Blockchain (local) | Hardhat Network (Chain ID 31337) |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Blockchain Client | ethers v6 |
| Database | MySQL 8, `mysql2` driver |
| Wallet | MetaMask |

---

## 3. Setup Instructions

### Prerequisites

- Node.js 18+
- MySQL 8 running locally
- MetaMask browser extension installed

### Step 1 — Install Dependencies

```bash
# Hardhat project
cd hardhat-project
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2 — Configure Environment

Create `frontend/.env.local` with the following values:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=<address from deploy step below>
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<your MySQL password>
DB_NAME=supplychain
```

### Step 3 — Create the MySQL Database

Connect to MySQL and run:

```sql
CREATE DATABASE supplychain;
USE supplychain;

CREATE TABLE IF NOT EXISTS users (
  wallet_address VARCHAR(42) PRIMARY KEY,
  role ENUM('NONE','MANUFACTURER','DISTRIBUTOR','RETAILER') NOT NULL DEFAULT 'NONE',
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  origin_country VARCHAR(100),
  batch_number VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  chain_product_id INT,
  creator_wallet VARCHAR(42) NULL,
  FOREIGN KEY (creator_wallet) REFERENCES users(wallet_address)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS events_log (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  actor_address VARCHAR(42) NOT NULL,
  action VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contacts (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  owner_wallet VARCHAR(42) NOT NULL,
  contact_address VARCHAR(42) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('MANUFACTURER','DISTRIBUTOR','RETAILER') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_owner_contact (owner_wallet, contact_address),
  INDEX idx_owner (owner_wallet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Step 3b — Start IPFS

Install Kubo from <https://docs.ipfs.tech/install/command-line/> and run:

```bash
ipfs init     # first time only
ipfs daemon
```

The DApp expects the HTTP API at `http://127.0.0.1:5001` and the gateway at `http://127.0.0.1:8080`.

### Step 4 — Start the Local Blockchain

In a dedicated terminal:

```bash
cd hardhat-project
npx hardhat node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` and prints 20 test accounts with private keys.

### Step 5 — Deploy the Contract

In a second terminal (keep the node running):

```bash
cd hardhat-project
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the printed contract address into `frontend/.env.local` as `NEXT_PUBLIC_CONTRACT_ADDRESS`.

### Step 6 — Assign the MANUFACTURER Role

```bash
cd hardhat-project
npx hardhat run scripts/assignRole.ts --network localhost
```

This grants the MANUFACTURER role to the deployer account (Account #0 from `npx hardhat node`).

### Step 7 — Configure MetaMask

1. Open MetaMask → Add a custom network:
   - **Network Name:** Hardhat Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** ETH
2. Import a private key from the `npx hardhat node` output (Account #0 has the MANUFACTURER role).

### Step 8 — Start the Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 4. Smart Contract Overview

**File:** `hardhat-project/contracts/SupplyChain.sol`

### Roles

| Role | Value | Capabilities |
|---|---|---|
| NONE | 0 | No access |
| MANUFACTURER | 1 | Add products |
| DISTRIBUTOR | 2 | Transfer ownership, update status |
| RETAILER | 3 | Transfer ownership, update status |

Roles are assigned by the contract admin (deployer) via `assignRole`. The on-chain role mapping is the authoritative source of permissions — the database role is used only for UI display.

### Product Status Transitions

```
CREATED (0) → IN_TRANSIT (1) → DELIVERED (2) → SOLD (3)
```

Status can only advance forward by one step at a time.

### Key Functions

| Function | Access | Description |
|---|---|---|
| `addProduct(name, origin, batchNumber)` | MANUFACTURER | Creates a new on-chain product |
| `transferOwnership(id, to)` | Current owner | Transfers product to a new role-holding address |
| `updateStatus(id, newStatus)` | Current owner | Advances product status by one step |
| `verifyProduct(id)` | Public (read) | Returns `(exists, currentOwner, status)` |
| `getProduct(id)` | Public (read) | Returns full product struct |
| `getHistory(id)` | Public (read) | Returns array of history entries |
| `getTotalProducts()` | Public (read) | Returns total product count |
| `assignRole(address, role)` | Admin only | Grants a role to an address |

### Events

| Event | Emitted When |
|---|---|
| `ProductAdded(id, manufacturer)` | New product created |
| `OwnershipTransferred(id, from, to)` | Ownership transferred |
| `StatusUpdated(id, status)` | Status updated |
| `RoleAssigned(user, role)` | Role granted |

### Tests

The contract is covered by 29 passing tests in `hardhat-project/test/SupplyChain.test.ts`, covering role access control, product creation, ownership transfer, status transitions, verification, and event emissions.

---

## 5. System Features

### Manufacturer
- Connect MetaMask wallet
- Add a new product (name, origin country, batch number, optional description)
- Transaction is submitted on-chain; the product ID is parsed from the `ProductAdded` event
- Product metadata is simultaneously saved to the MySQL database
- Redirected to the track page immediately after creation

### Distributor / Retailer
- Connect MetaMask wallet
- View their products on the dashboard
- Transfer ownership to another address (recipient must hold a valid role on-chain)
- Update product status (enforces the sequential transition rule from the contract)

### Public / Anyone
- Verify any product by ID without a wallet — calls `verifyProduct` via a read-only `JsonRpcProvider`
- View full product history on the track page (timeline of all on-chain history entries)

---

## 6. How to Use Each Page

### Dashboard (`/dashboard`)

Connect your MetaMask wallet. The dashboard fetches all products associated with your wallet address from the database and displays them as cards with a "Track Product" link.

If you are a MANUFACTURER and have no products yet, a prompt to create your first product is shown.

### Add Product (`/add-product`)

Only accessible to MANUFACTURER role addresses.

1. Fill in **Product Name**, **Origin Country**, and **Batch Number** (all required).
2. Optionally add a description.
3. Click **Add Product to Blockchain**.
4. MetaMask will prompt you to confirm the transaction.
5. After confirmation, you are automatically redirected to `/track/<productId>`.

### Track Product (`/track/[id]`)

Displays full on-chain data for a product:
- Name, origin, batch number, current owner address
- Current status (badge)
- Full history timeline showing each action, actor address, and timestamp

Data is fetched directly from the blockchain using a read-only provider, so this page works even without a connected wallet.

### Verify Product (`/verify`)

Public verification page — no wallet required.

1. Enter the product ID in the input field.
2. Click **Verify**.
3. The page calls `verifyProduct` on the smart contract and shows:
   - On-chain existence confirmation ("Verified on-chain" badge)
   - Current owner address
   - Current status
   - Off-chain metadata from the database (name, batch number, origin, description) when available
4. A **View Full History** link navigates to `/track/<id>` for the complete timeline.

---

## 7. API Reference

All endpoints return `{ data: ... }` on success or `{ error: "..." }` on failure.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products?wallet=<addr>` | List products by creator wallet |
| POST | `/api/products` | Create a product record in the database |
| GET | `/api/products/[id]` | Get a product by its chain ID |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create or update a user record |
| GET | `/api/events` | List events |
| POST | `/api/events` | Log a supply chain event |

---

## 8. Architecture Decisions

### On-chain roles are authoritative
Role checks in the smart contract (`onlyRole` modifier) gate all write operations. The database stores the role string only for UI display purposes (e.g., showing "Only manufacturers can add products"). A user cannot bypass the contract by manipulating the database.

### Event parsing for product ID
After `addProduct` is called, the new product ID is read from the `ProductAdded` event in the transaction receipt rather than calling `getTotalProducts()`. This is race-condition-safe in a multi-user environment — two simultaneous submissions cannot confuse which ID was assigned.

### Read-only calls bypass MetaMask
All read operations (`getProduct`, `getHistory`, `verifyProduct`) use `JsonRpcProvider("http://127.0.0.1:8545")` directly, so pages like Verify and Track work without any wallet connection.

### Dual data storage
The smart contract stores immutable ownership/status data. MySQL stores mutable metadata (description) and enables faster lookup by wallet address. The blockchain is always the source of truth for ownership and status; the database is the source of truth for display metadata.
