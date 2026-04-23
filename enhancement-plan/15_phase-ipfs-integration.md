# Phase 15 — IPFS integration (PROPOSAL PARITY — critical for marks)

## Goal
Part 1 of this assignment explicitly promises an **IPFS + on-chain hybrid** architecture: large files go to IPFS, only the CID is anchored on-chain. Today the DApp stores certification files in MySQL/filesystem via `/api/certifications` and anchors a SHA-256 string. This phase replaces that with a real IPFS upload and anchors the **real CID** (a `bafy…` v1 CID) on-chain.

## Files in scope (ALLOWED to create/edit)
- `frontend/lib/ipfs.ts` (new)
- `frontend/app/api/certifications/route.ts` (rewrite: proxy to IPFS daemon, return CID)
- `frontend/app/add-product/page.tsx` (replace SHA-256 path)
- `frontend/app/track/[id]/page.tsx` (render "View certificate on IPFS" link if CID present)
- `frontend/app/verify/page.tsx` (render "View certificate on IPFS" link if CID present)
- `frontend/.env.local.example` (new)
- `documentation/documentation_group13.md` (add the IPFS setup step)

## Files OUT of scope
- `hardhat-project/**` — the contract's `addCertificationHash(id, cid, fileName)` signature is unchanged. We just pass a real IPFS CID string instead of `sha256-...`.

## Dependencies
```bash
npm install kubo-rpc-client
```

## Pinning target — default: local IPFS daemon

This phase uses **Kubo (go-ipfs)** running locally so there is no cost, no API key, no third-party dependency during the demo.

### Pre-requisite for the examiner
Install Kubo and run `ipfs daemon`. The DApp expects the HTTP API at `http://127.0.0.1:5001` and the gateway at `http://127.0.0.1:8080`. Documentation phase 19 must explain this clearly.

### Optional: Pinata / web3.storage (NOT default)
Document this in the phase 19 docs as an *alternative* if the marker prefers remote pinning. Do not implement the HTTP calls for Pinata here — keep the code simple.

## Implementation steps

### 1. `frontend/.env.local.example` (new)
```
NEXT_PUBLIC_CONTRACT_ADDRESS=
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=supplychain

# IPFS (Phase 15). Run `ipfs daemon` locally.
IPFS_API_URL=http://127.0.0.1:5001
NEXT_PUBLIC_IPFS_GATEWAY=http://127.0.0.1:8080
NEXT_PUBLIC_IPFS_PUBLIC_GATEWAY=https://ipfs.io
```

### 2. `frontend/lib/ipfs.ts` (new)
```ts
export function gatewayUrl(cid: string): string {
  const base = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "http://127.0.0.1:8080";
  return `${base}/ipfs/${cid}`;
}

export function publicGatewayUrl(cid: string): string {
  const base = process.env.NEXT_PUBLIC_IPFS_PUBLIC_GATEWAY ?? "https://ipfs.io";
  return `${base}/ipfs/${cid}`;
}

/** Upload a file from the browser by POSTing to our /api/certifications proxy. */
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

### 3. Rewrite `frontend/app/api/certifications/route.ts`

Replace ALL existing logic. The new route receives a `multipart/form-data` with the `file` field, forwards it to the local Kubo HTTP API, and returns the resulting CID.

```ts
import { NextRequest, NextResponse } from "next/server";
import { create } from "kubo-rpc-client";

export const runtime = "nodejs";

const ipfs = create({ url: process.env.IPFS_API_URL ?? "http://127.0.0.1:5001" });

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const added = await ipfs.add({ path: file.name, content: buffer }, { cidVersion: 1, pin: true });
    return NextResponse.json({ cid: added.cid.toString(), fileName: file.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : "IPFS upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

> If the existing route also supported GET (to fetch certs), delete that path; fetching is now done directly against the gateway URL.

### 4. Update `frontend/app/add-product/page.tsx`

- **Remove** the `computeSHA256` and `fileToBase64` helpers.
- **Remove** the base64 JSON POST path. Replace with a call to `uploadToIPFS`.

Replace the certificate anchoring block inside `handleSubmit`:
```tsx
if (certFile) {
  setStatus("Uploading certification to IPFS...");
  const { cid, fileName } = await uploadToIPFS(certFile);
  setStatus("Anchoring IPFS CID on-chain...");
  const certTx = await contract.addCertificationHash(productId, cid, fileName);
  await certTx.wait();
}
```

Import:
```tsx
import { uploadToIPFS } from "@/lib/ipfs";
```

### 5. Display the IPFS link on Track and Verify

Both `/track/[id]` and `/verify` can call `contract.getCertificationHash(productId)` (or whatever read function the contract exposes — check `SupplyChain.sol`). If the contract does not have a getter, read the `certificationHash` field off `getProduct` (which many implementations expose) — **do not** modify the contract.

Wherever the cert info is rendered, use:
```tsx
import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { gatewayUrl, publicGatewayUrl } from "@/lib/ipfs";

// When a CID is known:
<div className="rounded-lg border border-border-subtle bg-white/[0.03] p-4">
  <p className="text-gray-500 mb-2 text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Certification</p>
  <div className="flex flex-wrap gap-2">
    <a href={gatewayUrl(cid)} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200">
      Local gateway <ExternalLink className="w-3 h-3" />
    </a>
    <span className="text-gray-600">·</span>
    <a href={publicGatewayUrl(cid)} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-1.5 text-sm text-sky-300 hover:text-sky-200">
      Public gateway <ExternalLink className="w-3 h-3" />
    </a>
  </div>
  <p className="text-xs font-mono text-gray-500 break-all mt-2">{cid}</p>
</div>
```

### 6. Update `documentation/documentation_group13.md` setup section

Add a new step between "Create the MySQL Database" and "Start the Local Blockchain":

```md
### Step 3b — Start IPFS

Install Kubo from <https://docs.ipfs.tech/install/command-line/> and run:

```bash
ipfs init     # first time only
ipfs daemon
```

The DApp expects the HTTP API at `http://127.0.0.1:5001` and the gateway at `http://127.0.0.1:8080`.
```

## Acceptance checks
- [ ] With `ipfs daemon` running, uploading a certification file during Add Product returns a `bafy…` CID and the tx `addCertificationHash` succeeds with that CID.
- [ ] Opening `http://127.0.0.1:8080/ipfs/<cid>` in the browser downloads/displays the exact original file.
- [ ] The CID anchored on-chain (read back via `getProduct` or `getCertificationHash`) matches the CID shown in the UI.
- [ ] If the IPFS daemon is NOT running, the UI shows a toast error like "IPFS upload failed" and does NOT send a tx.
- [ ] The track and verify pages render a "Certification — Local gateway / Public gateway" card for products that have a cert.

## STOP — request user review
After finishing, post exactly: `Phase 15 complete — requesting review.`
