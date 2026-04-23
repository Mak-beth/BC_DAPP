const { ethers } = require("ethers");
const raw = require("../public/abi/SupplyChain.json");
const ABI = raw.abi || raw;

const ACCOUNTS = {
  MANUFACTURER: {
    addr: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    key:  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  DISTRIBUTOR: {
    addr: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    key:  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
  RETAILER: {
    addr: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    key:  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  },
};
const CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// lifecycle values and their history entry counts (excluding existing products):
//  full+cert  : addProduct(1) + cert(1) + transfer(1) + IN_TRANSIT(1) + transfer(1) + DELIVERED(1) + SOLD(1) = 7
//  full       : addProduct(1) + transfer(1) + IN_TRANSIT(1) + transfer(1) + DELIVERED(1) + SOLD(1) = 6
//  partial    : addProduct(1) + transfer(1) + IN_TRANSIT(1) = 3
//  cert       : addProduct(1) + cert(1) = 2
//  created    : addProduct(1) = 1
const PRODUCTS = [
  // 8 × full+cert (7 each = 56 new entries)
  { name: "Ethiopian Coffee",    origin: "Ethiopia",    batch: "BATCH-ETH-001", life: "full+cert", certFile: "organic-cert.pdf"         },
  { name: "Colombian Coffee",    origin: "Colombia",    batch: "BATCH-COL-001", life: "full+cert", certFile: "fair-trade-cert.pdf"      },
  { name: "Japanese Green Tea",  origin: "Japan",       batch: "BATCH-JPN-001", life: "full+cert", certFile: "jis-standard.pdf"         },
  { name: "Darjeeling Tea",      origin: "India",       batch: "BATCH-IND-001", life: "full+cert", certFile: "iso9001-cert.pdf"         },
  { name: "Swiss Chocolate",     origin: "Switzerland", batch: "BATCH-CHE-001", life: "full+cert", certFile: "halal-cert.pdf"           },
  { name: "Kenyan Coffee",       origin: "Kenya",       batch: "BATCH-KEN-001", life: "full+cert", certFile: "rainforest-alliance.pdf"  },
  { name: "Peruvian Cocoa",      origin: "Peru",        batch: "BATCH-PER-001", life: "full+cert", certFile: "organic-cert.pdf"         },
  { name: "Vietnam Coffee",      origin: "Vietnam",     batch: "BATCH-VNM-001", life: "full+cert", certFile: "utz-cert.pdf"             },
  // 4 × full (6 each = 24 new entries)
  { name: "Brazilian Coffee",    origin: "Brazil",      batch: "BATCH-BRA-001", life: "full" },
  { name: "Moroccan Argan Oil",  origin: "Morocco",     batch: "BATCH-MAR-001", life: "full" },
  { name: "Turkish Hazelnuts",   origin: "Turkey",      batch: "BATCH-TUR-001", life: "full" },
  { name: "Sri Lanka Cinnamon",  origin: "Sri Lanka",   batch: "BATCH-LKA-001", life: "full" },
  // 4 × partial (3 each = 12 new entries)
  { name: "Mexican Vanilla",     origin: "Mexico",      batch: "BATCH-MEX-001", life: "partial" },
  { name: "Madagascar Vanilla",  origin: "Madagascar",  batch: "BATCH-MDG-001", life: "partial" },
  { name: "Indonesian Spices",   origin: "Indonesia",   batch: "BATCH-IDN-001", life: "partial" },
  { name: "Thai Jasmine Rice",   origin: "Thailand",    batch: "BATCH-THA-001", life: "partial" },
  // 4 × created-only (1 each = 4 new entries)
  { name: "Guatemalan Coffee",   origin: "Guatemala",   batch: "BATCH-GTM-001", life: "created" },
  { name: "Yemeni Coffee",       origin: "Yemen",       batch: "BATCH-YEM-001", life: "created" },
  { name: "Rwandan Coffee",      origin: "Rwanda",      batch: "BATCH-RWA-001", life: "created" },
  { name: "Ugandan Coffee",      origin: "Uganda",      batch: "BATCH-UGA-001", life: "created" },
];

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const iface    = new ethers.Interface(ABI);

  // Fetch current nonces for all accounts
  const nonces = {};
  for (const [role, acc] of Object.entries(ACCOUNTS)) {
    nonces[role] = await provider.getTransactionCount(acc.addr, "latest");
  }
  console.log("Starting nonces:", nonces);

  // Send one transaction, increment nonce
  async function call(role, fnName, ...args) {
    const acc = ACCOUNTS[role];
    const w   = new ethers.Wallet(acc.key, provider);
    const c   = new ethers.Contract(CONTRACT, ABI, w);
    const tx  = await c[fnName](...args, { nonce: nonces[role]++ });
    return tx.wait();
  }

  // Extract productId from ProductAdded event
  function extractPid(receipt) {
    const parsed = receipt.logs
      .map((l) => { try { return iface.parseLog(l); } catch { return null; } })
      .filter(Boolean);
    const evt = parsed.find((e) => e.name === "ProductAdded");
    return Number(evt.args.id ?? evt.args[0]);
  }

  // Deterministic fake CID per product name
  function fakeCid(name) {
    const hex = Buffer.from(name).toString("hex").padEnd(64, "0").slice(0, 64);
    return "sha256-" + hex;
  }

  console.log("\n=== GENERATING TRANSACTIONS ===\n");

  for (const s of PRODUCTS) {
    process.stdout.write(
      "  " + s.name.padEnd(24) + "(" + s.life.padEnd(10) + ") ... "
    );

    // 1. addProduct
    const rec = await call("MANUFACTURER", "addProduct", s.name, s.origin, s.batch);
    const pid = extractPid(rec);
    let entries = 1;

    // 2. Cert (MANUFACTURER adds it before handoff)
    if (s.life === "full+cert") {
      await call("MANUFACTURER", "addCertificationHash", pid, fakeCid(s.name), s.certFile);
      entries++;
    }

    // 3. Transfer to DISTRIBUTOR + IN_TRANSIT
    if (s.life === "full" || s.life === "full+cert" || s.life === "partial") {
      await call("MANUFACTURER", "transferOwnership", pid, ACCOUNTS.DISTRIBUTOR.addr);
      entries++;
      await call("DISTRIBUTOR", "updateStatus", pid, 1);
      entries++;
    }

    // 4. DISTRIBUTOR -> RETAILER + DELIVERED + SOLD
    if (s.life === "full" || s.life === "full+cert") {
      await call("DISTRIBUTOR", "transferOwnership", pid, ACCOUNTS.RETAILER.addr);
      entries++;
      await call("RETAILER", "updateStatus", pid, 2);
      entries++;
      await call("RETAILER", "updateStatus", pid, 3);
      entries++;
    }

    console.log("product #" + pid + "  +" + entries + " entries");
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  const ro = new ethers.Contract(CONTRACT, ABI, provider);
  const total = Number(await ro.getTotalProducts());
  const STATUS_LABEL = { 0: "CREATED", 1: "IN_TRANSIT", 2: "DELIVERED", 3: "SOLD" };

  console.log("\n=== ALL PRODUCTS & HISTORY COUNTS ===\n");
  let grandTotal = 0;

  for (let i = 1; i <= total; i++) {
    const prod  = await ro.getProduct(i);
    const hist  = await ro.getHistory(i);
    const certs = await ro.getCertifications(i);
    const owner = Object.entries(ACCOUNTS).find(
      ([, a]) => a.addr.toLowerCase() === prod.currentOwner.toLowerCase()
    )?.[0] || prod.currentOwner.slice(0, 10) + "...";
    grandTotal += hist.length;
    console.log(
      "#" + String(i).padStart(2) + "  " +
      prod.name.padEnd(24) +
      STATUS_LABEL[Number(prod.status)].padEnd(12) +
      ("owner=" + owner).padEnd(22) +
      "history=" + String(hist.length).padStart(2) +
      "  certs=" + certs.length
    );
  }

  console.log("\n" + "─".repeat(72));
  console.log("Total products:        " + total);
  console.log("Total history records: " + grandTotal);
  console.log(
    grandTotal >= 100
      ? "PASS — " + grandTotal + " records (target: 100+)"
      : "FAIL — only " + grandTotal + " records"
  );
}

main().catch((err) => { console.error(err); process.exit(1); });
