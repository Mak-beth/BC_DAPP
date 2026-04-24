# Supply Chain DApp — Part 2 Implementation
**CT124-3-3-BCD Blockchain Development · Group 13**

| Name | TP Number |
|---|---|
| NOOR KHALIL ABDULLAH KHALED | TP078880 |
| TAHA FAHD AHMED MOHAMMED THABIT | TP078281 |
| ABUBAKER ELSIDDIG TAGELDEEN SIDDIG | TP078003 |
| MUHMMAD AHMED KHAN | TP069769 |

---

## Part 1 to Part 2 Mapping

| Part 1 section | Promised feature | Part 2 evidence |
|---|---|---|
| §4.3 Hybrid data | On-chain + IPFS | §Architecture + Figure 1; Figures 6.1–6.3 |
| §4.5 Data table | IPFS CID on-chain | Figure 6.1 (uploadToIPFS), Figure 6.2 (addCertificationHash) |
| §5.2.1 | Product QR code | Figure 7.3 (ProductQR), screenshot §Screenshots |
| §5.2.1 | Audit dashboard w/ filters | Figures 9.1–9.2, screenshot §Screenshots |
| §5.3 | addProduct / transferOwnership / addCertificationHash / verifyProduct | Figures 2.1, 4.1, 6.2, 5.2 |
| §5.2.1 | MetaMask role-gated auth | Figures 3.1, 3.2 |
| §5.3 transferOwnership | Transfer ownership via UI (one-click, ContactPicker) | Figures 11.1, 11.2, 11.3 |
| §3.2 Professional quality | Three-theme design system (Nebula / Aurora / Obsidian) | Figures 15.1, 15.2, 15.3, 15.4 |
| §5.4 IoT integration | Real-time sensor data logging on-chain + live chart | Figures 13.1, 13.2, 13.3 |
| §5.3 Product safety | On-chain product recall system with UI issue/lift flow | Figures 14.1, 14.2, 14.3 |

---

## Executive Summary

This document presents the Part 2 implementation of the Supply Chain DApp developed by Group 13 for CT124-3-3-BCD Blockchain Development at Asia Pacific University. The DApp provides a tamper-proof, end-to-end provenance system that lets manufacturers, distributors, and retailers track physical goods on a permissioned blockchain, while allowing any member of the public to verify a product's authenticity without holding a wallet.

Part 1 identified three core problems: the USD 467 billion counterfeit goods market (OECD/EUIPO, 2025), the 283-day average breach detection window in enterprise supply chains (IBM, 2024), and the 72,000–169,000 child deaths per year attributable to falsified medical products (WHO, 2024). The proposed solution was a hybrid architecture combining on-chain immutability with off-chain flexibility, role-gated smart-contract functions, and a professional Next.js frontend. Part 2 delivers on every one of those promises and adds significant enhancements: IPFS-anchored certification documents, QR code generation and scanning for consumer verification, a five-dimension audit filter bar with shareable URL state, a contacts address book that makes the transferOwnership function genuinely usable in one click, a three-theme design system (Nebula, Aurora, Obsidian) with animated aurora backgrounds, an IoT sensor simulation module that logs temperature and humidity readings on-chain and renders them in a live line chart, and a full product recall system with on-chain issue/lift flow and a red RecallBanner on all verification surfaces. The test suite has grown to 43 passing tests (29 original + 6 IoT + 8 Recall), covering every smart-contract function with positive, negative, and access-control cases.

This report is structured so that every Part 1 promise is cross-referenced to a code figure. The Part 1 to Part 2 mapping table above is the primary reference for the examiner.

---

## System Overview

The DApp is composed of four interacting layers. The blockchain layer is a local Hardhat node running at port 31337 with a single Solidity 0.8.20 contract, `SupplyChain.sol`, deployed to a deterministic address. The contract maintains four role levels (NONE, MANUFACTURER, DISTRIBUTOR, RETAILER) enforced by the `onlyRole` modifier, and exposes fourteen public functions covering product lifecycle, certification anchoring, sensor telemetry, and product recall. All state mutations emit events that are indexed in a MySQL `events_log` table by a server-side listener.

The off-chain storage layer is a local IPFS Kubo daemon running at port 5001 for writes and port 8080 for reads. When a manufacturer uploads a certification document, the frontend sends a multipart POST to the `/api/certifications` Next.js route, which pins the file to IPFS and returns the Content Identifier (CID). The CID is then written to the smart contract via `addCertificationHash`, creating an immutable, verifiable link between the on-chain record and the off-chain file.

The application layer is a Next.js 14 App Router project written in TypeScript. It connects to the blockchain using ethers v6's `BrowserProvider` (for signed writes via MetaMask) and `JsonRpcProvider` (for unsigned reads). A set of `/api/*` routes backed by a mysql2/promise connection pool provide the hybrid data access layer described in Part 1 §4.3. MySQL stores four tables: `users`, `products`, `events_log`, and `contacts`.

The user layer supports five roles: Manufacturer (full write access), Distributor (transfer and status update for owned products), Retailer (same as Distributor), Regulator/Auditor (read-only audit view), and anonymous public users (verify page, no wallet required). Navigation links are conditionally rendered based on the role returned by `contract.roles(address)` after wallet connection.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Solidity 0.8.20 | Smart contract language; immutable business logic on-chain |
| Hardhat | Local Ethereum node, contract compilation, deployment scripts, and test runner |
| ethers v6 | TypeScript library for ABI encoding, provider management, and signer wrapping |
| Next.js 14 App Router | Full-stack React framework; co-locates frontend pages and `/api/*` server routes |
| TypeScript | Static typing across both frontend components and API handlers |
| Tailwind CSS | Utility-first CSS; custom-property theme tokens override for three themes |
| MySQL (mysql2/promise) | Relational off-chain store for products, events, contacts, and users |
| MetaMask | Browser wallet; injects `window.ethereum` for transaction signing |
| IPFS Kubo (local daemon) | Content-addressed storage for certification documents; CID anchored on-chain |
| Framer Motion | Declarative React animation library for page transitions, modals, and timeline |
| recharts | Composable SVG chart library; used for the SensorChart line graph |

---

## Architecture — Figure 1

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

---

## Setup Instructions

### Prerequisites

- Node.js 18 or later
- MySQL 8.0 or later
- IPFS Kubo CLI installed (`ipfs` on PATH)
- MetaMask browser extension

### Step 1 — MySQL database

Start the MySQL server and execute the following SQL to create the database and all four required tables:

```sql
CREATE DATABASE IF NOT EXISTS supplychain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS events_log (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  actor_address VARCHAR(42) NOT NULL,
  action VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
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

> Note: `db.ts` also runs `createTables()` automatically on first import, so the tables self-create if the database already exists.

### Step 2 — IPFS daemon

```bash
ipfs init          # first time only
ipfs daemon        # runs on port 5001 (API) and 8080 (gateway)
```

### Step 3 — Hardhat node and contract deployment

```bash
cd hardhat-project
npm install
npx hardhat node                          # starts local node at 31337
# in a second terminal:
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/assignGroupRoles.ts --network localhost
```

Copy the deployed contract address and paste it into `frontend/.env.local` as:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### Step 4 — Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local     # then fill in values
npm run dev                          # http://localhost:3000
```

Required `.env.local` values:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_IPFS_GATEWAY=http://127.0.0.1:8080
NEXT_PUBLIC_IPFS_PUBLIC_GATEWAY=https://ipfs.io
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=supplychain
```

### Step 5 — MetaMask

Add a custom network in MetaMask: RPC URL `http://127.0.0.1:8545`, Chain ID `31337`. Import Hardhat test account private keys from the node output. The `assignGroupRoles.ts` script assigns the first four non-admin accounts their respective roles (MANUFACTURER, DISTRIBUTOR, RETAILER, and a second RETAILER).

---

## Feature Walkthrough

---

### Feature 1 — Add Product (on-chain)

This feature implements `addProduct` from Part 1 §5.3 and satisfies the marking criterion "complete and usable implementation of proposed smart-contract functions" by providing a three-step wizard that validates inputs, calls the contract, parses the emitted event, saves off-chain metadata, and optionally uploads a certification file to IPFS before anchoring the CID on-chain.

**Figure 2.1 — `addProduct` Solidity function**

```solidity
function addProduct(
    string memory name, 
    string memory origin, 
    string memory batchNumber
) external onlyRole(Role.MANUFACTURER) {
    require(bytes(name).length > 0, "SupplyChain: Product name is required");
    require(bytes(origin).length > 0, "SupplyChain: Origin is required");
    require(bytes(batchNumber).length > 0, "SupplyChain: Batch number is required");

    productCounter++;
    uint256 newId = productCounter;

    products[newId] = Product({
        id: newId,
        name: name,
        origin: origin,
        batchNumber: batchNumber,
        currentOwner: msg.sender,
        status: Status.CREATED,
        createdAt: block.timestamp
    });

    history[newId].push(HistoryEntry({
        actor: msg.sender,
        action: "Product Created",
        timestamp: block.timestamp
    }));

    emit ProductAdded(newId, msg.sender);
}
```

**Figure 2.1 — `addProduct` Solidity function.** *Source: `hardhat-project/contracts/SupplyChain.sol` lines 101–130.*

---

**Figure 2.2 — `ProductAdded` event parsing in the frontend**

```typescript
const parsed = receipt.logs
  .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
  .filter(Boolean);
const event = parsed.find((e: any) => e.name === "ProductAdded");
if (!event) throw new Error("ProductAdded event not found");
const productId = Number(event.args.id ?? event.args[0]);
```

**Figure 2.2 — `ProductAdded` event parsing.** *Source: `frontend/app/add-product/page.tsx` lines 55–60.*

---

**Figure 2.3 — Off-chain metadata save to MySQL**

```typescript
const apiBody: CreateProductBody = {
  name: form.name.trim(),
  description: form.description.trim(),
  origin_country: form.origin_country.trim(),
  batch_number: form.batch_number.trim(),
  chain_product_id: productId,
  creator_wallet: walletState.address ?? "",
};
fetch("/api/products", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(apiBody),
}).catch(() => {/* non-fatal */});
```

**Figure 2.3 — DB metadata save.** *Source: `frontend/app/add-product/page.tsx` lines 62–74.*

---

### Feature 2 — Wallet + Role Registration

This feature implements MetaMask role-gated authentication from Part 1 §5.2.1 and satisfies the marking criterion "functional MetaMask wallet connection with role management" by requiring `wallet_requestPermissions` before every connection and filtering navigation links based on the role stored on-chain.

**Figure 3.1 — `connectWallet` helper**

```typescript
export async function connectWallet(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Cannot connect wallet outside of browser environment");
  }

  const ethWindow = window as EthereumWindow;
  if (!ethWindow.ethereum) {
    throw new Error("MetaMask or compatible wallet is required");
  }

  const provider = new BrowserProvider(ethWindow.ethereum);
  
  try {
    await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
    const accounts = await provider.send("eth_requestAccounts", []) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found from wallet");
    }

    return accounts[0];
  } catch (err: any) {
    const errorStr = err?.message || err?.toString() || "";
    
    if (err?.code === -32002 || errorStr.includes("-32002") || errorStr.includes("already pending")) {
      throw new Error("A connection request is already pending. Please open your wallet extension to accept it.");
    }
    
    if (err?.code === 4001 || errorStr.includes("4001") || errorStr.includes("rejected")) {
      throw new Error("Connection request was rejected.");
    }

    throw err;
  }
}
```

**Figure 3.1 — `connectWallet` helper.** *Source: `frontend/lib/contract.ts` lines 51–87.*

---

**Figure 3.2 — Role-aware navigation**

```typescript
const links = [
  { href: "/dashboard",     label: "Dashboard",     role: "any" as const },
  { href: "/add-product",   label: "Add Product",   role: "MANUFACTURER" as const },
  { href: "/verify",        label: "Verify",        role: "any" as const },
  { href: "/contacts",      label: "Contacts",      role: "any" as const },
  { href: "/audit",         label: "Audit",         role: "any" as const },
  { href: "/iot-simulator", label: "IoT Simulator", role: "requires_role" as const },
];

const visibleLinks = links.filter((l) => {
  if (l.role === "any") return true;
  if (l.role === "requires_role") return walletState.isConnected && walletState.role !== "NONE";
  return walletState.role === l.role;
});
```

**Figure 3.2 — Role-aware nav filter.** *Source: `frontend/components/Navbar.tsx` lines 12–29.*

---

### Feature 3 — Transfer Ownership + Status Update

This feature implements `transferOwnership` and `updateStatus` from Part 1 §5.3 and satisfies the marking criterion "complete and usable implementation of proposed smart-contract functions" by enforcing both ownership checks and sequential status transitions at the Solidity level.

**Figure 4.1 — `transferOwnership` Solidity function**

```solidity
function transferOwnership(uint256 id, address to) external productExists(id) onlyOwner(id) {
    require(to != address(0), "Invalid recipient address");
    require(roles[to] != Role.NONE, "Recipient must have a valid role");
    require(to != msg.sender, "SupplyChain: Cannot transfer to self");
    
    address from = products[id].currentOwner;
    products[id].currentOwner = to;

    history[id].push(HistoryEntry({
        actor: msg.sender,
        action: "Ownership Transferred",
        timestamp: block.timestamp
    }));

    emit OwnershipTransferred(id, from, to);
}
```

**Figure 4.1 — `transferOwnership` Solidity function.** *Source: `hardhat-project/contracts/SupplyChain.sol` lines 132–147.*

---

**Figure 4.2 — `updateStatus` Solidity with sequential-transition check**

```solidity
function updateStatus(uint256 id, Status newStatus) external productExists(id) onlyOwner(id) {
    require(products[id].status != Status.SOLD, "Product already completed");
    require(uint8(newStatus) == uint8(products[id].status) + 1, "Invalid status transition");

    products[id].status = newStatus;

    history[id].push(HistoryEntry({
        actor: msg.sender,
        action: "Status Updated",
        timestamp: block.timestamp
    }));

    emit StatusUpdated(id, newStatus);
}
```

**Figure 4.2 — `updateStatus` with sequential-transition check.** *Source: `hardhat-project/contracts/SupplyChain.sol` lines 149–162.*

---

### Feature 4 — Verify Product (public, no wallet)

This feature implements `verifyProduct` from Part 1 §5.3 and satisfies the marking criterion "public product verification without requiring a wallet" by using a read-only `JsonRpcProvider` so the page loads even for unauthenticated users, and additionally checking the recall state to surface any active alerts.

**Figure 5.1 — Read-only provider (no wallet required)**

```typescript
export async function getContract(withSigner = false): Promise<Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is missing. Check NEXT_PUBLIC_CONTRACT_ADDRESS.");
  }

  const { abi } = await getABI();

  if (withSigner) {
    const ethWindow = window as EthereumWindow;
    if (!ethWindow.ethereum) {
      throw new Error("MetaMask or compatible wallet is required for write access");
    }
    const provider = new BrowserProvider(ethWindow.ethereum);
    const signer = await provider.getSigner();
    return new Contract(CONTRACT_ADDRESS, abi, signer);
  } else {
    const provider = new JsonRpcProvider(RPC_URL);
    return new Contract(CONTRACT_ADDRESS, abi, provider);
  }
}
```

**Figure 5.1 — Read-only `JsonRpcProvider` path.** *Source: `frontend/lib/contract.ts` lines 25–49.*

---

**Figure 5.2 — `verifyProduct` Solidity function**

```solidity
function verifyProduct(uint256 id) external view productExists(id) returns (bool exists, address currentOwner, Status status) {
    Product storage p = products[id];
    exists = true;
    currentOwner = p.currentOwner;
    status = p.status;
}
```

**Figure 5.2 — `verifyProduct` Solidity function.** *Source: `hardhat-project/contracts/SupplyChain.sol` lines 164–169.*

---

**Figure 5.3 — Verify handler in the frontend**

```typescript
async function runVerify(rawId: string) {
  const id = rawId.trim();
  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    toast.error("Enter a valid product ID (positive number)");
    return;
  }
  setLoading(true);
  setResult(null);
  setRecall(null);
  try {
    const contract = await getContract(false);
    const [exists, currentOwner, statusIndex] = await contract.verifyProduct(id);
    // ...off-chain enrichment omitted for brevity
    setResult({ exists, currentOwner, status: statusIndexToString(statusIndex), dbProduct, certification });
    try {
      const recallRaw = await contract.getRecall(id);
      setRecall({ active: recallRaw.active, reason: recallRaw.reason,
                  issuedBy: recallRaw.issuedBy, timestamp: Number(recallRaw.timestamp) });
    } catch { /* recall not available */ }
  } catch {
    toast.error("Product not found on the blockchain.");
  } finally {
    setLoading(false);
  }
}
```

**Figure 5.3 — Verify handler.** *Source: `frontend/app/verify/page.tsx` lines 63–102.*

---

### Feature 5 — Certification Anchoring via IPFS

This feature closes the Part 1 §4.3 and §4.5 hybrid storage promise and satisfies the marking criterion "IPFS integration for decentralised document storage with on-chain CID anchoring" by uploading the file to a local Kubo daemon and writing the returned CID permanently into the smart contract.

**Figure 6.1 — `uploadToIPFS` helper**

```typescript
export async function uploadToIPFS(file: File): Promise<{ cid: string; fileName: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/certifications", { method: "POST", body: fd });
  if (!res.ok) {
    const msg = await res.text().catch(() => "IPFS upload failed");
    throw new Error(msg);
  }
  const json = await res.json();
  return { cid: json.cid, fileName: file.name };
}
```

**Figure 6.1 — `uploadToIPFS` helper.** *Source: `frontend/lib/ipfs.ts` lines 12–22.*

---

**Figure 6.2 — `addCertificationHash` Solidity function**

```solidity
function addCertificationHash(
    uint256 productId,
    string memory cid,
    string memory fileName
) external productExists(productId) onlyOwner(productId) {
    require(bytes(cid).length > 0, "SupplyChain: CID required");
    require(bytes(fileName).length > 0, "SupplyChain: File name required");

    certifications[productId].push(CertificationEntry({
        cid: cid,
        fileName: fileName,
        timestamp: block.timestamp,
        uploader: msg.sender
    }));

    history[productId].push(HistoryEntry({
        actor: msg.sender,
        action: "Certification Added",
        timestamp: block.timestamp
    }));

    emit CertificationAdded(productId, cid, msg.sender);
}
```

**Figure 6.2 — `addCertificationHash` Solidity function.** *Source: `hardhat-project/contracts/SupplyChain.sol` lines 183–205.*

---

**Figure 6.3 — IPFS upload then on-chain anchor call site**

```typescript
if (certFile) {
  setStatus("Uploading certification to IPFS...");
  const { cid, fileName } = await uploadToIPFS(certFile);
  setStatus("Anchoring IPFS CID on-chain...");
  const certTx = await contract.addCertificationHash(productId, cid, fileName);
  await certTx.wait();
}
```

**Figure 6.3 — IPFS upload then on-chain anchor.** *Source: `frontend/app/add-product/page.tsx` lines 76–82.*

---

### Feature 6 — Track Timeline and QR

This feature implements provenance history and QR code from Part 1 §5.2.1 and satisfies the marking criterion "complete product tracking timeline with provenance" by reading the immutable `history` array from the contract and rendering it with staggered Framer Motion animations, and generating a downloadable QR code that encodes the verify URL.

**Figure 7.1 — `getHistory` Solidity function**

```solidity
function getHistory(uint256 id) external view productExists(id) returns (HistoryEntry[] memory) {
    return history[id];
}
```

**Figure 7.1 — `getHistory` Solidity function.** *Source: `hardhat-project/contracts/SupplyChain.sol` lines 175–177.*

---

**Figure 7.2 — `HistoryTimeline` component**

```typescript
export function HistoryTimeline({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ol className="relative pl-6">
      <motion.span
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "top" }}
        className="absolute left-[10px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-400/60 via-border-subtle to-transparent"
      />
      {entries.map((e, i) => {
        const isLatest = i === entries.length - 1;
        return (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            className="relative pb-5 last:pb-0"
          >
            <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {new Date(e.timestamp * 1000).toLocaleString()}
              </div>
              <p className="mt-1 text-sm text-white font-medium">{e.action}</p>
              <p className="text-xs text-gray-400 font-mono break-all mt-0.5">{e.actor}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
```

**Figure 7.2 — `HistoryTimeline` component.** *Source: `frontend/app/track/[id]/_components/HistoryTimeline.tsx` lines 12–51.*

---

**Figure 7.3 — `ProductQR` component**

```typescript
export function ProductQR({ productId, size = 160 }: { productId: number; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  const verifyUrl =
    typeof window === "undefined"
      ? `/verify?id=${productId}`
      : `${window.location.origin}/verify?id=${productId}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, verifyUrl, {
      width: size, margin: 1, color: { dark: "#0B0F1A", light: "#FFFFFF" },
    });
    QRCode.toDataURL(verifyUrl, { width: 512, margin: 2 }).then(setDataUrl);
  }, [verifyUrl, size]);

  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.03] backdrop-blur-xl p-4 flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-md bg-white p-1" width={size} height={size}
        role="img" aria-label="QR code for product verification" />
      <p className="text-[11px] font-mono text-gray-500 break-all text-center">{verifyUrl}</p>
      {dataUrl && (
        <a href={dataUrl} download={`product-${productId}-qr.png`}>
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>Download PNG</Button>
        </a>
      )}
    </div>
  );
}
```

**Figure 7.3 — `ProductQR` component.** *Source: `frontend/components/ProductQR.tsx` lines 8–36.*

---

### Feature 7 — API Layer + MySQL

This feature implements the hybrid architecture from Part 1 §4.3 and satisfies the marking criterion "functional REST API with database integration" by providing a Next.js route handler that reads from and writes to MySQL, so that human-readable metadata (description, origin country) can be stored off-chain while the authoritative product identity lives on-chain.

**Figure 8.1 — POST handler for `/api/products`**

```typescript
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as CreateProductBody;

    if (!body.name || !body.creator_wallet || body.chain_product_id === undefined) {
      return NextResponse.json(
        { error: "name, creator_wallet, and chain_product_id are required" },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO products 
        (name, description, origin_country, batch_number, chain_product_id, creator_wallet) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [body.name, body.description || null, body.origin_country || null,
       body.batch_number || null, body.chain_product_id, body.creator_wallet]
    );

    const newRows = await query<DbProduct>(
      `SELECT * FROM products WHERE chain_product_id = ? AND creator_wallet = ? ORDER BY id DESC LIMIT 1`,
      [body.chain_product_id, body.creator_wallet]
    );

    return NextResponse.json({ data: newRows[0] }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Figure 8.1 — POST handler for `/api/products`.** *Source: `frontend/app/api/products/route.ts` lines 29–74.*

---

**Figure 8.2 — MySQL connection pool**

```typescript
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME || "supplychain",
  connectionLimit: 10,
  waitForConnections: true,
});

export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params as never);
  return rows as T[];
}
```

**Figure 8.2 — mysql2/promise connection pool.** *Source: `frontend/lib/db.ts` lines 3–16.*

---

### Feature 8 — Auditor Dashboard with Filters

This feature implements the audit dashboard from Part 1 §5.2.1 and satisfies the marking criterion "role-appropriate dashboard views with event history" by providing five independent filter dimensions whose state is serialised into the URL query string, making filtered views shareable between regulators by copy-pasting a URL.

**Figure 9.1 — `FilterBar` component**

```typescript
export function FilterBar({ actions, onChange }: FilterBarProps) {
  const router = useRouter();
  const params = useSearchParams();

  const [local, setLocal] = useState<AuditFilters>({
    productId:   params.get("productId")   ?? "",
    batchNumber: params.get("batchNumber") ?? "",
    from:        params.get("from")        ?? "",
    to:          params.get("to")          ?? "",
    action:      params.get("action")      ?? "",
  });

  useEffect(() => {
    onChange(local);
    const sp = new URLSearchParams();
    Object.entries(local).forEach(([k, v]) => { if (v) sp.set(k, v); });
    const qs = sp.toString();
    router.replace(qs ? `/audit?${qs}` : "/audit");
  }, [local]);

  // renders a 5-column grid of Input and Select controls
}
```

**Figure 9.1 — `FilterBar` with URL-synchronised state.** *Source: `frontend/app/audit/_components/FilterBar.tsx` lines 26–89.*

---

**Figure 9.2 — Filter composition in audit page**

```typescript
const filtered = useMemo(() => {
  return rows.filter((r) => {
    if (filters.productId && String(r.product_id) !== filters.productId) return false;
    if (filters.batchNumber && !(r.batch_number ?? "").toLowerCase().includes(filters.batchNumber.toLowerCase())) return false;
    if (filters.action && r.action !== filters.action) return false;
    if (filters.from) {
      const fromTs = new Date(filters.from).getTime();
      if (new Date(r.created_at).getTime() < fromTs) return false;
    }
    if (filters.to) {
      const toTs = new Date(filters.to).getTime() + 24 * 60 * 60 * 1000 - 1;
      if (new Date(r.created_at).getTime() > toTs) return false;
    }
    return true;
  });
}, [rows, filters]);
```

**Figure 9.2 — Client-side filter composition.** *Source: `frontend/app/audit/page.tsx` lines 41–56.*

---

### Feature 9 — Contacts Address Book + Transfer Ownership UI

This feature surfaces `transferOwnership` as a one-click UI action, satisfying the marking criterion "complete and usable implementation of proposed smart-contract functions" by providing a ContactPicker dropdown that fetches the user's saved contacts from MySQL and pre-fills the recipient address field, eliminating the need to copy-paste 42-character hex addresses.

**Figure 11.1 — `ContactPicker` component (key logic)**

```typescript
export function ContactPicker({ ownerWallet, allowRoles, value, onChange, ... }: ContactPickerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [mode, setMode] = useState<"pick" | "manual">("pick");

  useEffect(() => {
    if (!ownerWallet) return;
    (async () => {
      const res = await fetch(`/api/contacts?wallet=${ownerWallet}`);
      if (!res.ok) { setLoadError(true); return; }
      const json = await res.json();
      const list = (json.data ?? []) as Contact[];
      setContacts(allowRoles ? list.filter((c) => allowRoles.includes(c.role)) : list);
    })();
  }, [ownerWallet]);

  // renders two tabs: "Pick from contacts" dropdown and "Enter new address" Input + save checkbox
}
```

**Figure 11.1 — `ContactPicker` component.** *Source: `frontend/components/ContactPicker.tsx` lines 27–71.*

---

**Figure 11.2 — `TransferOwnershipModal` contract call**

```typescript
async function submit() {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    toast.error("Enter a valid 0x-prefixed address");
    return;
  }
  setLoading(true);
  try {
    const contract = await getContract(true);
    const tx = await contract.transferOwnership(productId, address);
    await tx.wait();
    toast.success(`Ownership of #${productId} transferred`);
    if (saveNew && name.trim()) {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_wallet: walletState.address,
                               contact_address: address, name: name.trim(), role }),
      });
    }
    onSuccess();
    onClose();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Transfer failed");
  } finally {
    setLoading(false);
  }
}
```

**Figure 11.2 — `TransferOwnershipModal` contract call.** *Source: `frontend/components/TransferOwnershipModal.tsx` lines 30–62.*

---

**Figure 11.3 — `/api/contacts` POST handler**

```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const owner_wallet = String(body.owner_wallet ?? "").toLowerCase();
    const contact_address = String(body.contact_address ?? "").toLowerCase();
    const name = String(body.name ?? "").trim();
    const role = String(body.role ?? "") as "MANUFACTURER" | "DISTRIBUTOR" | "RETAILER";

    if (!isHex(owner_wallet) || !isHex(contact_address)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }
    if (!name || !["MANUFACTURER","DISTRIBUTOR","RETAILER"].includes(role)) {
      return NextResponse.json({ error: "name and role required" }, { status: 400 });
    }
    if (owner_wallet === contact_address) {
      return NextResponse.json({ error: "Cannot add your own wallet as a contact" }, { status: 400 });
    }

    const [result]: any = await pool.query(
      "INSERT INTO contacts (owner_wallet, contact_address, name, role, notes) VALUES (?,?,?,?,?) " +
      "ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), notes = VALUES(notes)",
      [owner_wallet, contact_address, name, role, null]
    );
    return NextResponse.json({ data: { id: result.insertId } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
```

**Figure 11.3 — `/api/contacts` POST handler.** *Source: `frontend/app/api/contacts/route.ts` lines 26–54.*

---

**Figure 11.4 — `UpdateStatusModal` contract call**

```typescript
const next: Record<ProductStatus, ProductStatus | null> = {
  CREATED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
  DELIVERED: "SOLD",
  SOLD: null,
};
const statusIndex: Record<ProductStatus, number> = {
  CREATED: 0, IN_TRANSIT: 1, DELIVERED: 2, SOLD: 3,
};

async function submit() {
  if (!target) return;
  setLoading(true);
  try {
    const contract = await getContract(true);
    const tx = await contract.updateStatus(productId, statusIndex[target]);
    await tx.wait();
    toast.success(`Status advanced to ${target}`);
    onSuccess();
    onClose();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Status update failed");
  } finally {
    setLoading(false);
  }
}
```

**Figure 11.4 — `UpdateStatusModal` contract call.** *Source: `frontend/components/UpdateStatusModal.tsx` lines 10–48.*

---

### Feature 10 — Testing

This feature satisfies the marking criterion "comprehensive unit tests covering all smart-contract functions" by providing 43 tests that exercise every public function with at least one positive case, one negative case, and one access-control case. Tests are organised into nine `describe` blocks corresponding to the contract's functional domains.

**Figure 10.1 — `onlyRole` access-control tests (representative sample)**

```typescript
it("non-manufacturer cannot add product", async function () {
  await expect(
    supplyChain.connect(distributor).addProduct("Watch", "UK", "B111")
  ).to.be.revertedWith("SupplyChain: Unauthorized role");
});

it("non-admin cannot assign role", async function () {
  await expect(
    supplyChain.connect(manufacturer).assignRole(customer.address, 2)
  ).to.be.revertedWith("SupplyChain: Only admin can assign roles");
});

it("non-manufacturer cannot issue recall", async function () {
  await expect(
    supplyChain.connect(distributor).issueRecall(1, "Faulty batch")
  ).to.be.revertedWith("SupplyChain: Unauthorized role");
});
```

**Figure 10.1 — Access-control tests.** *Source: `hardhat-project/test/SupplyChain.test.ts` lines 57–68, 267–272.*

> Note: 43 tests pass (29 original + 6 IoT + 8 Recall). Re-run with `cd hardhat-project && npx hardhat test`.

---

### Feature 11 — IoT Sensor Simulation

This feature implements Part 1 §5.4 IoT integration and satisfies the marking criterion "IoT device integration or simulation with real-time data" by storing temperature (in tenths of degrees Celsius) and humidity readings permanently on-chain and rendering them in a dual-axis recharts line graph on the Track page.

**Figure 13.1 — `logSensorReading` Solidity function**

```solidity
function logSensorReading(
    uint256 productId,
    int256  temperature,
    uint256 humidity
) external productExists(productId) {
    require(roles[msg.sender] != Role.NONE, "SupplyChain: Unauthorized");
    require(humidity <= 100, "SupplyChain: Invalid humidity");

    sensorReadings[productId].push(SensorEntry({
        temperature: temperature,
        humidity:    humidity,
        timestamp:   block.timestamp,
        logger:      msg.sender
    }));

    emit SensorReading(productId, temperature, humidity, block.timestamp, msg.sender);
}
```

**Figure 13.1 — `logSensorReading` Solidity function.** *Source: `hardhat-project/contracts/SupplyChain.sol` lines 211–227.*

---

**Figure 13.2 — `getSensorReadings` Solidity function**

```solidity
function getSensorReadings(uint256 id)
    external
    view
    productExists(id)
    returns (SensorEntry[] memory)
{
    return sensorReadings[id];
}
```

**Figure 13.2 — `getSensorReadings` Solidity function.** *Source: `hardhat-project/contracts/SupplyChain.sol` lines 229–236.*

---

**Figure 13.3 — `SensorChart` component**

```typescript
export function SensorChart({ readings }: Props) {
  const data = readings.map((r) => ({
    time: new Date(r.timestamp * 1000).toLocaleTimeString(),
    temperature: parseFloat((r.temperature / 10).toFixed(1)),
    humidity: r.humidity,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
        <YAxis yAxisId="temp" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
        <YAxis yAxisId="hum" orientation="right" domain={[0, 100]}
          tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
        <Tooltip contentStyle={{ background: "var(--bg-raised)", borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line yAxisId="temp" type="monotone" dataKey="temperature"
          name="Temp (C)" stroke="var(--sig-1)" strokeWidth={2} dot={false} />
        <Line yAxisId="hum" type="monotone" dataKey="humidity"
          name="Humidity (%)" stroke="var(--sig-2)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Figure 13.3 — `SensorChart` dual-axis line chart.** *Source: `frontend/app/track/[id]/_components/SensorChart.tsx` lines 10–36.*

---

### Feature 12 — Product Recall System

This feature implements product safety management and satisfies the marking criterion "complete implementation of proposed smart-contract functions" by adding `issueRecall` and `liftRecall` to the contract, surfacing a red `RecallBanner` on both the Verify and Track pages for any product with an active recall, and providing the `IssueRecallModal` so manufacturers can issue or lift recalls with a single transaction.

**Figure 14.1 — `issueRecall` and `liftRecall` Solidity functions**

```solidity
function issueRecall(uint256 productId, string memory reason)
    external productExists(productId) onlyRole(Role.MANUFACTURER)
{
    require(bytes(reason).length > 0, "SupplyChain: Reason required");
    require(!recalls[productId].active, "SupplyChain: Already recalled");

    recalls[productId] = RecallEntry({
        active:    true,
        reason:    reason,
        issuedBy:  msg.sender,
        timestamp: block.timestamp
    });

    history[productId].push(HistoryEntry({
        actor: msg.sender, action: "Product Recalled", timestamp: block.timestamp
    }));

    emit ProductRecalled(productId, reason, msg.sender);
}

function liftRecall(uint256 productId)
    external productExists(productId) onlyRole(Role.MANUFACTURER)
{
    require(recalls[productId].active, "SupplyChain: Not recalled");

    recalls[productId].active = false;

    history[productId].push(HistoryEntry({
        actor: msg.sender, action: "Recall Lifted", timestamp: block.timestamp
    }));

    emit RecallLifted(productId, msg.sender);
}
```

**Figure 14.1 — `issueRecall` and `liftRecall` Solidity functions.** *Source: `hardhat-project/contracts/SupplyChain.sol` lines 238–278.*

---

**Figure 14.2 — `RecallBanner` component**

```typescript
export function RecallBanner({ recall }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl border p-4"
      style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.35)" }}
    >
      <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
      <div className="space-y-0.5">
        <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>PRODUCT RECALLED</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{recall.reason}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Issued by {shortenAddress(recall.issuedBy)} &middot;{" "}
          {new Date(recall.timestamp * 1000).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}
```

**Figure 14.2 — `RecallBanner` component.** *Source: `frontend/components/RecallBanner.tsx` lines 9–35.*

---

**Figure 14.3 — `IssueRecallModal` contract call**

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setBusy(true);
  try {
    const contract = await getContract(true);
    let tx;
    if (isRecalled) {
      tx = await contract.liftRecall(productId);
    } else {
      if (!reason.trim()) { toast.error("Recall reason is required."); setBusy(false); return; }
      tx = await contract.issueRecall(productId, reason.trim());
    }
    await tx.wait();
    toast.success(isRecalled ? "Recall lifted." : "Recall issued on-chain.");
    setReason("");
    onSuccess();
    onClose();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Transaction failed.");
  } finally {
    setBusy(false);
  }
}
```

**Figure 14.3 — `IssueRecallModal` contract call.** *Source: `frontend/components/IssueRecallModal.tsx` lines 21–43.*

---

### Feature 13 — Three-Theme Design System

This feature addresses the A+ criterion "outstanding quality; complete in every way" (80–100%) by providing three professionally designed colour themes — Nebula (dark purple), Aurora (teal/cyan), and Obsidian (charcoal/amber) — switchable at runtime with zero page reload, using CSS custom properties so every component inherits the correct palette automatically.

**Figure 15.1 — `ThemeProvider` and `useTheme`**

```typescript
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("nebula");

  useEffect(() => {
    const saved = (typeof window !== "undefined"
      ? window.localStorage.getItem(STORAGE_KEY) : null) as ThemeName | null;
    if (saved && LIST.includes(saved)) setThemeState(saved);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("theme-nebula", "theme-aurora", "theme-obsidian");
    if (theme !== "nebula") html.classList.add(`theme-${theme}`);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, list: LIST, labels: LABELS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
```

**Figure 15.1 — `ThemeProvider` and `useTheme`.** *Source: `frontend/lib/theme.tsx` lines 18–44.*

---

**Figure 15.2 — `AuroraBackground` drifting blob animation**

```typescript
export function AuroraBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-40 -left-40 w-[55rem] h-[55rem] rounded-full blur-3xl opacity-60 animate-aurora-drift"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sig-1) 35%, transparent), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[50rem] h-[50rem] rounded-full blur-3xl opacity-50 animate-aurora-drift"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sig-3) 30%, transparent), transparent 70%)", animationDelay: "6s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] rounded-full blur-3xl opacity-25 animate-aurora-drift"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sig-2) 40%, transparent), transparent 70%)", animationDelay: "12s" }}
      />
    </div>
  );
}
```

**Figure 15.2 — `AuroraBackground` drifting blob animation.** *Source: `frontend/components/AuroraBackground.tsx` lines 3–25.*

---

**Figure 15.3 — `ThemeSwitcher` palette tiles**

```typescript
export function ThemeSwitcher() {
  const { theme, setTheme, list, labels } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button aria-label="Change theme" onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border-subtle ...">
        <Sparkles className="w-4 h-4" style={{ color: "var(--sig-1)" }} />
        <span className="text-xs font-medium">{labels[theme]}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul className="absolute right-0 mt-2 w-40 rounded-lg border p-1 z-50"
            onMouseLeave={() => setOpen(false)}>
            {list.map((t) => (
              <li key={t}>
                <button onClick={() => { setTheme(t); setOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm">
                  <span className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ background: "var(--sig-1)", boxShadow: "0 0 8px var(--sig-1)" }} />
                  {labels[t]}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Figure 15.3 — `ThemeSwitcher` palette tiles.** *Source: `frontend/components/ThemeSwitcher.tsx` lines 9–52.*

---

**Figure 15.4 — CSS variable block for all three themes**

```css
:root {
  /* Nebula (default) */
  --bg-base:   #050814;
  --bg-raised: #0D1428;
  --sig-1: #A855F7;
  --sig-2: #6366F1;
  --sig-3: #06B6D4;
  --gradient-sig: linear-gradient(120deg, var(--sig-1) 0%, var(--sig-2) 35%, var(--sig-3) 100%);
}

html.theme-aurora {
  --bg-base:   #041414;
  --bg-raised: #062A2A;
  --sig-1: #5EEAD4;
  --sig-2: #38BDF8;
  --sig-3: #818CF8;
  --gradient-sig: linear-gradient(120deg, var(--sig-1) 0%, var(--sig-2) 50%, var(--sig-3) 100%);
}

html.theme-obsidian {
  --bg-base:   #0A0A0C;
  --bg-raised: #141418;
  --sig-1: #F3F4F6;
  --sig-2: #A3A3A3;
  --sig-3: #D97706;
  --gradient-sig: linear-gradient(120deg, var(--sig-1) 0%, var(--sig-3) 100%);
}
```

**Figure 15.4 — CSS variable block (`:root`, `.theme-aurora`, `.theme-obsidian`).** *Source: `frontend/app/globals.css` lines 5–66.*

---

## Smart Contract Reference

### Functions

| Function | Access Control | Description |
|---|---|---|
| `addProduct(name, origin, batchNumber)` | `onlyRole(MANUFACTURER)` | Mints a new product on-chain; emits `ProductAdded`; auto-increments `productCounter` |
| `getProduct(id)` | Public view | Returns the full `Product` struct for the given ID |
| `getTotalProducts()` | Public view | Returns the current value of `productCounter` |
| `transferOwnership(id, to)` | `productExists` + `onlyOwner` | Transfers custodianship; recipient must hold a non-NONE role |
| `updateStatus(id, newStatus)` | `productExists` + `onlyOwner` | Advances status exactly one step (CREATED to IN_TRANSIT to DELIVERED to SOLD) |
| `addCertificationHash(productId, cid, fileName)` | `productExists` + `onlyOwner` | Anchors an IPFS CID permanently on-chain; appended to `CertificationEntry[]` |
| `getCertifications(id)` | Public view | Returns all `CertificationEntry` structs for the product |
| `getHistory(id)` | Public view | Returns the `HistoryEntry[]` provenance log |
| `verifyProduct(id)` | Public view | Returns `(exists, currentOwner, status)` without requiring a wallet |
| `logSensorReading(productId, temperature, humidity)` | Any non-NONE role | Appends a `SensorEntry`; temperature stored in tenths of degrees Celsius |
| `getSensorReadings(id)` | Public view | Returns all `SensorEntry` structs for the product |
| `issueRecall(productId, reason)` | `onlyRole(MANUFACTURER)` | Issues an active recall; reverts if already recalled or reason empty |
| `liftRecall(productId)` | `onlyRole(MANUFACTURER)` | Deactivates the recall; reverts if not currently recalled |
| `getRecall(id)` | Public view | Returns the `RecallEntry` struct (active flag, reason, issuer, timestamp) |
| `assignRole(user, role)` | Admin only | Grants a role to any address; cannot assign `NONE` |

### Events

| Event | Parameters | Emitted by |
|---|---|---|
| `RoleAssigned` | `user`, `role` | `assignRole` |
| `ProductAdded` | `id`, `manufacturer` | `addProduct` |
| `OwnershipTransferred` | `id`, `from`, `to` | `transferOwnership` |
| `StatusUpdated` | `id`, `status` | `updateStatus` |
| `CertificationAdded` | `productId`, `cid`, `uploader` | `addCertificationHash` |
| `SensorReading` | `productId`, `temperature`, `humidity`, `timestamp`, `logger` | `logSensorReading` |
| `ProductRecalled` | `productId`, `reason`, `issuedBy` | `issueRecall` |
| `RecallLifted` | `productId`, `liftedBy` | `liftRecall` |

### Roles

| Value | Role | Capabilities |
|---|---|---|
| 0 | NONE | No write access; cannot receive product transfer |
| 1 | MANUFACTURER | addProduct, issueRecall, liftRecall, all owner actions |
| 2 | DISTRIBUTOR | transferOwnership and updateStatus for owned products |
| 3 | RETAILER | transferOwnership and updateStatus for owned products |

### Status Transitions

| From | To | Revert condition |
|---|---|---|
| CREATED (0) | IN_TRANSIT (1) | Any other target reverts with "Invalid status transition" |
| IN_TRANSIT (1) | DELIVERED (2) | Any other target reverts |
| DELIVERED (2) | SOLD (3) | Any other target reverts |
| SOLD (3) | — | All updates revert with "Product already completed" |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products?wallet=0x...` | Returns all products created by the given wallet |
| POST | `/api/products` | Inserts off-chain metadata; requires `name`, `creator_wallet`, `chain_product_id` |
| GET | `/api/products/[id]` | Returns a single product row by MySQL `id` |
| GET | `/api/events` | Returns all events joined with `batch_number`; accepts `?product_id=N` filter |
| POST | `/api/events` | Inserts a new `events_log` row; requires `product_id`, `actor_address`, `action` |
| GET | `/api/contacts?wallet=0x...` | Returns all contacts owned by the given wallet, ordered by name |
| POST | `/api/contacts` | Upserts a contact; `ON DUPLICATE KEY UPDATE` prevents duplicates |
| PATCH | `/api/contacts/[id]` | Updates `name`, `role`, or `notes` for an existing contact |
| DELETE | `/api/contacts/[id]` | Removes a contact by MySQL ID |
| GET | `/api/users?wallet=0x...` | Returns the user row for the given wallet (company name, role) |
| POST | `/api/users` | Upserts a user record (wallet registers with company name) |
| POST | `/api/certifications` | Proxies a multipart file to the IPFS Kubo daemon; returns `{ cid }` |

---

## Architecture Decisions

### IPFS CID anchored on-chain (versus SHA-256 hash)

An SHA-256 hash proves a document has not been altered but it does not locate the document. By storing the IPFS Content Identifier (CID), a verifier can retrieve the original file from any IPFS gateway — local or public — without trusting a centralised server. The CID is itself a cryptographic hash of the content (multihash encoded), so the immutability guarantee is identical to SHA-256 while adding discoverability. The cost is one additional `string` field in a `CertificationEntry` struct, which is negligible for a permissioned supply-chain use case.

### Filter state in URL (shareable for regulators)

The `FilterBar` component uses `router.replace` to serialise every active filter dimension into the URL query string on every change. This means a regulator who discovers an anomaly can share the exact filtered view with a colleague or supervisor by copying the browser URL, with no additional export step. The approach also survives a page refresh. The alternative — React state only — would require the user to re-apply filters manually after every reload.

### Contacts stored in MySQL not on-chain (gas cost reasoning)

Storing human-readable metadata (contact name, role label, notes) on-chain would cost approximately 20,000 gas per 32-byte word at EVM pricing, and would make the data permanently public. Address-book entries are operationally sensitive (they reveal business relationships) and are likely to change frequently. MySQL provides faster lookups, supports `ON DUPLICATE KEY UPDATE` upserts, and allows soft-deletes without incurring gas. The authoritative on-chain link is the `roles` mapping; the contacts table is a UI convenience layer that never bypasses the smart-contract access-control checks.

### CSS custom-property theme system (versus hardcoded Tailwind classes)

Hardcoding Tailwind colour classes (for example `bg-indigo-600`) would require every component to define three variants of itself. Instead, all colours are expressed as references to `var(--sig-1)`, `var(--bg-base)`, and so on. Switching themes requires only toggling a class on `<html>` — a single DOM mutation. Components written once work across all three themes with no conditional logic. The approach is also forward-compatible: adding a fourth theme requires only a new CSS block and one entry in the `LIST` array in `theme.tsx`.

---

## Screenshots

> The following are placeholder captions. Replace each with an actual screenshot before submission.

**Screenshot 1 — Dashboard with role badge, company name, and stat tiles**

*[Insert screenshot of /dashboard showing the Manufacturer role badge, company name in the header, and total products / recent events stat tiles]*

**Screenshot 2 — Add Product step 3 review**

*[Insert screenshot of /add-product at step 3 showing the product name, origin, batch number, and certification file name in the review panel, with the Confirm and Submit button]*

**Screenshot 3 — Add Product success screen with confetti and QR**

*[Insert screenshot of the SuccessScreen component showing the confetti animation, product ID, and the rendered ProductQR canvas with the Download PNG button]*

**Screenshot 4 — Track page timeline, status progress bar, and QR**

*[Insert screenshot of /track/[id] showing the HistoryTimeline entries with timestamps, the StatusProgressBar indicating current status, and the ProductQR component]*

**Screenshot 5 — Track page SensorChart with temperature and humidity readings**

*[Insert screenshot of /track/[id] scrolled to the SensorChart section, showing the dual-axis line graph with at least three temperature and humidity data points]*

**Screenshot 6 — Track page with RecallBanner visible at the top**

*[Insert screenshot of /track/[id] for a recalled product, showing the red RecallBanner with the recall reason and issuer address at the very top of the result card]*

**Screenshot 7 — IssueRecallModal open with reason textarea filled**

*[Insert screenshot of the IssueRecallModal dialog open, showing the red Issue Recall button and the reason textarea filled with a sample reason such as Contamination detected in batch]*

**Screenshot 8 — Verify page with authenticity seal**

*[Insert screenshot of /verify showing the AuthenticitySeal animation and the Verified on-chain badge alongside the product name and current owner address]*

**Screenshot 9 — Verify page with RecallBanner for a recalled product**

*[Insert screenshot of /verify for a recalled product showing the red RecallBanner above the AuthenticitySeal, demonstrating that public users are warned of safety issues]*

**Screenshot 10 — Verify page with QR scanner open, Upload tab**

*[Insert screenshot of /verify with the QRScanner modal open, showing the camera feed and the Upload tab for scanning from an image file]*

**Screenshot 11 — IPFS gateway showing the actual certificate file**

*[Insert screenshot of the browser at http://127.0.0.1:8080/ipfs/[CID] showing the uploaded PDF or image certificate, proving the file is accessible via IPFS]*

**Screenshot 12 — Audit page with filters applied and donut chart**

*[Insert screenshot of /audit with at least two filter fields active, the donut chart re-rendered for the filtered subset, and the row count showing Showing X of Y]*

**Screenshot 13 — IoT Simulator page, readings submitted successfully**

*[Insert screenshot of /iot-simulator after a successful submission, showing the success toast and the form fields (product ID, temperature, humidity) that were submitted]*

**Screenshot 14 — Contacts page with saved contact list and role badges**

*[Insert screenshot of /contacts showing at least three saved contacts with their wallet addresses truncated, role badges (DISTRIBUTOR, RETAILER), and the Add Contact button]*

**Screenshot 15 — Transfer Ownership modal with ContactPicker showing saved contacts tab**

*[Insert screenshot of the TransferOwnershipModal open, with the ContactPicker in Pick from contacts mode showing the dropdown list of saved contacts with name, role, and truncated address]*

**Screenshot 16 — ThemeSwitcher open, Aurora theme active, full dashboard**

*[Insert screenshot of the full dashboard page with the ThemeSwitcher dropdown open showing Nebula / Aurora / Obsidian options, Aurora currently selected, and the teal aurora background blobs visible]*

---

## References

1. IBM Security. (2024). *Cost of a Data Breach Report 2024*. IBM Corporation.
2. Institute for Supply Management. (2024). *Supply Chain Risk Management Survey*. ISM.
3. Global Market Insights. (2024). *Blockchain in Supply Chain Market Size Report*. GMI.
4. OECD/EUIPO. (2025). *Trade in Counterfeit and Pirated Goods: Mapping the Economic Impact*. OECD Publishing.
5. OECD. (2020). *Illicit Trade: Converging Criminal Networks*. OECD Publishing.
6. World Health Organization. (2024). *Substandard and Falsified Medical Products*. WHO.
