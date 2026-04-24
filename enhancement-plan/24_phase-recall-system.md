# Phase 24 — Product Recall System

## Goal

Add on-chain recall governance. A MANUFACTURER can issue a recall for any product — regardless of who currently owns it — and later lift the recall. Recalled products display a prominent red warning banner on the verify and track pages, and a "RECALLED" badge on every ProductCard in the dashboard. A MANUFACTURER can also issue or lift a recall directly from the track page.

This demonstrates a core property of public blockchains: governance without a central authority. Once a recall is on-chain it is visible to every user — a consumer scanning a QR code on a product in a store will see the recall immediately. This exceeds Part 1's minimum requirements and directly targets the "outstanding quality; complete in every way" A+ marking criterion by showing real-world blockchain utility (product safety enforcement enforced by code, not a company).

**IMPORTANT — the contract is UN-FROZEN for this phase.** Three new functions, two new events, one new struct, and one new mapping are added to `SupplyChain.sol`. After completing all contract edits and test additions, redeploy: `npx hardhat run scripts/deploy.ts --network localhost` and update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `frontend/.env.local`.

## Files in scope (ALLOWED to create/edit)

- `hardhat-project/contracts/SupplyChain.sol`
- `hardhat-project/test/SupplyChain.test.ts`
- `frontend/lib/types.ts`
- `frontend/components/RecallBanner.tsx` (new)
- `frontend/components/IssueRecallModal.tsx` (new)
- `frontend/app/verify/page.tsx`
- `frontend/app/track/[id]/page.tsx`
- `frontend/components/ProductCard.tsx`
- `frontend/app/dashboard/page.tsx`

## Files OUT of scope

- All other contract files (`hardhat-project/scripts/**`, `hardhat-project/hardhat.config.ts`)
- All other frontend pages and components not listed above
- `documentation/documentation_group13.md`
- `PRESENTATION.md`

## Dependencies

No new npm packages.

## Implementation steps

### 1. Contract — add `RecallEntry` struct, mapping, events, and three functions

In `hardhat-project/contracts/SupplyChain.sol`, insert the struct and mapping after the `SensorEntry` mapping (or after `CertificationEntry` if Phase 23 has not run):

```solidity
struct RecallEntry {
    bool    active;
    string  reason;
    address issuedBy;
    uint256 timestamp;
}

mapping(uint256 => RecallEntry) public recalls;
```

Add two events after the existing events block:

```solidity
event ProductRecalled(uint256 indexed productId, string reason, address indexed issuedBy);
event RecallLifted(uint256 indexed productId, address indexed liftedBy);
```

Add three functions at the end of the contract, before the closing `}`:

```solidity
function issueRecall(uint256 productId, string memory reason)
    external
    productExists(productId)
    onlyRole(Role.MANUFACTURER)
{
    require(bytes(reason).length > 0, "SupplyChain: Reason required");
    require(!recalls[productId].active,  "SupplyChain: Already recalled");

    recalls[productId] = RecallEntry({
        active:    true,
        reason:    reason,
        issuedBy:  msg.sender,
        timestamp: block.timestamp
    });

    history[productId].push(HistoryEntry({
        actor:     msg.sender,
        action:    "Product Recalled",
        timestamp: block.timestamp
    }));

    emit ProductRecalled(productId, reason, msg.sender);
}

function liftRecall(uint256 productId)
    external
    productExists(productId)
    onlyRole(Role.MANUFACTURER)
{
    require(recalls[productId].active, "SupplyChain: Not recalled");

    recalls[productId].active = false;

    history[productId].push(HistoryEntry({
        actor:     msg.sender,
        action:    "Recall Lifted",
        timestamp: block.timestamp
    }));

    emit RecallLifted(productId, msg.sender);
}

function getRecall(uint256 id)
    external
    view
    productExists(id)
    returns (RecallEntry memory)
{
    return recalls[id];
}
```

### 2. Contract tests — add Recall test block

In `hardhat-project/test/SupplyChain.test.ts`, add a new `describe` block after the IoT block (or after Certifications if Phase 23 has not run):

```typescript
describe("Product Recall", function () {
  beforeEach(async function () {
    await contract.connect(manufacturer).addProduct("Widget", "CN", "BATCH-A");
  });

  it("manufacturer can issue a recall", async function () {
    await expect(
      contract.connect(manufacturer).issueRecall(1, "Contamination detected")
    )
      .to.emit(contract, "ProductRecalled")
      .withArgs(1, "Contamination detected", manufacturer.address);
    const recall = await contract.getRecall(1);
    expect(recall.active).to.be.true;
    expect(recall.reason).to.equal("Contamination detected");
  });

  it("non-manufacturer cannot issue recall", async function () {
    await contract.connect(manufacturer).assignRole(distributor.address, 2);
    await expect(
      contract.connect(distributor).issueRecall(1, "Faulty batch")
    ).to.be.revertedWith("SupplyChain: Unauthorized role");
  });

  it("reverts when reason is empty", async function () {
    await expect(
      contract.connect(manufacturer).issueRecall(1, "")
    ).to.be.revertedWith("SupplyChain: Reason required");
  });

  it("reverts when product already recalled", async function () {
    await contract.connect(manufacturer).issueRecall(1, "First recall");
    await expect(
      contract.connect(manufacturer).issueRecall(1, "Second recall")
    ).to.be.revertedWith("SupplyChain: Already recalled");
  });

  it("manufacturer can lift a recall", async function () {
    await contract.connect(manufacturer).issueRecall(1, "Safety check");
    await expect(
      contract.connect(manufacturer).liftRecall(1)
    ).to.emit(contract, "RecallLifted");
    const recall = await contract.getRecall(1);
    expect(recall.active).to.be.false;
  });

  it("reverts liftRecall when product is not recalled", async function () {
    await expect(
      contract.connect(manufacturer).liftRecall(1)
    ).to.be.revertedWith("SupplyChain: Not recalled");
  });

  it("getRecall reflects active=false after lift", async function () {
    await contract.connect(manufacturer).issueRecall(1, "Defect");
    await contract.connect(manufacturer).liftRecall(1);
    const recall = await contract.getRecall(1);
    expect(recall.active).to.be.false;
    expect(recall.reason).to.equal("Defect");
  });

  it("getRecall reverts for non-existent product", async function () {
    await expect(contract.getRecall(999)).to.be.revertedWith(
      "Product does not exist"
    );
  });
});
```

Run `npx hardhat test` — all tests must pass (8 new tests; total ≥ 43).

### 3. Redeploy the contract

```bash
cd hardhat-project
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the new contract address into `frontend/.env.local` as `NEXT_PUBLIC_CONTRACT_ADDRESS=0x...`.

### 4. Add `RecallEntry` type to `frontend/lib/types.ts`

Append after `SensorEntry` (or after `CertificationEntry` if Phase 23 has not run):

```typescript
export interface RecallEntry {
  active: boolean;
  reason: string;
  issuedBy: string;
  timestamp: number;
}
```

### 5. Create `frontend/components/RecallBanner.tsx`

```tsx
"use client";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { shortenAddress } from "@/lib/contract";
import type { RecallEntry } from "@/lib/types";

interface Props { recall: RecallEntry; }

export function RecallBanner({ recall }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl border p-4"
      style={{
        background: "rgba(239,68,68,0.08)",
        borderColor: "rgba(239,68,68,0.35)",
      }}
    >
      <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
      <div className="space-y-0.5">
        <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
          PRODUCT RECALLED
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {recall.reason}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Issued by {shortenAddress(recall.issuedBy)} &middot;{" "}
          {new Date(recall.timestamp * 1000).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}
```

### 6. Create `frontend/components/IssueRecallModal.tsx`

```tsx
"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getContract } from "@/lib/contract";
import { useToast } from "@/components/ui/Toast";

interface Props {
  productId: number;
  isRecalled: boolean;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function IssueRecallModal({ productId, isRecalled, open, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const contract = await getContract(true);
      let tx;
      if (isRecalled) {
        tx = await contract.liftRecall(productId);
      } else {
        if (!reason.trim()) { toast.error("Recall reason is required."); return; }
        tx = await contract.issueRecall(productId, reason.trim());
      }
      await tx.wait();
      toast.success(isRecalled ? "Recall lifted." : "Recall issued on-chain.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transaction failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isRecalled ? "Lift Recall" : "Issue Recall"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRecalled ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Remove the active recall for Product #{productId}. This action is recorded permanently on-chain.
          </p>
        ) : (
          <>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Issue a recall for Product #{productId}. The reason is stored permanently on-chain and visible to anyone who verifies this product.
            </p>
            <textarea
              className="w-full rounded-lg border bg-transparent p-3 text-sm resize-none"
              style={{ borderColor: "rgba(255,255,255,0.12)", color: "var(--text-primary)" }}
              rows={3}
              placeholder="Describe the reason for this recall…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={!isRecalled}
            />
          </>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant={isRecalled ? "secondary" : "danger"}
            loading={busy}
          >
            {isRecalled ? "Lift Recall" : "Issue Recall"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

### 7. Update `frontend/app/verify/page.tsx`

After a successful product verification fetch, also call `contract.getRecall(id)`. Store the result in state as `recall: RecallEntry | null`. If `recall?.active`, render `<RecallBanner recall={recall} />` above the `<AuthenticitySeal />`.

Add imports:
```tsx
import { RecallBanner } from "@/components/RecallBanner";
import type { RecallEntry } from "@/lib/types";
```

Add state:
```tsx
const [recall, setRecall] = useState<RecallEntry | null>(null);
```

Inside the verify handler, after setting the result state, add:
```tsx
try {
  const recallRaw = await contract.getRecall(id);
  setRecall({
    active:    recallRaw.active,
    reason:    recallRaw.reason,
    issuedBy:  recallRaw.issuedBy,
    timestamp: Number(recallRaw.timestamp),
  });
} catch { setRecall(null); }
```

In the JSX, before `<AuthenticitySeal />`, insert:
```tsx
{recall?.active && <RecallBanner recall={recall} />}
```

### 8. Update `frontend/app/track/[id]/page.tsx`

Add imports:
```tsx
import { RecallBanner } from "@/components/RecallBanner";
import { IssueRecallModal } from "@/components/IssueRecallModal";
import type { RecallEntry } from "@/lib/types";
```

Add state:
```tsx
const [recall, setRecall] = useState<RecallEntry | null>(null);
const [recallOpen, setRecallOpen] = useState(false);
```

Inside `load()`, after fetching certifications, add:
```tsx
try {
  const recallRaw = await contract.getRecall(id);
  setRecall({
    active:    recallRaw.active,
    reason:    recallRaw.reason,
    issuedBy:  recallRaw.issuedBy,
    timestamp: Number(recallRaw.timestamp),
  });
} catch { setRecall(null); }
```

At the top of the page JSX (before the product header), insert:
```tsx
{recall?.active && <RecallBanner recall={recall} />}
```

Near the existing Transfer / Update Status buttons (visible when `isOwner`), add a recall button visible when `walletState.role === "MANUFACTURER"`:
```tsx
{walletState.role === "MANUFACTURER" && (
  <Button variant="danger" onClick={() => setRecallOpen(true)}>
    {recall?.active ? "Lift Recall" : "Issue Recall"}
  </Button>
)}
<IssueRecallModal
  productId={id}
  isRecalled={!!recall?.active}
  open={recallOpen}
  onClose={() => setRecallOpen(false)}
  onSuccess={load}
/>
```

### 9. Update `frontend/components/ProductCard.tsx`

Accept an optional `isRecalled?: boolean` prop. When `true`, render a small red pill badge:

```tsx
{isRecalled && (
  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
    style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
    RECALLED
  </span>
)}
```

Place this badge directly below the `<StatusBadge>` in the card.

### 10. Update `frontend/app/dashboard/page.tsx`

Add import:
```tsx
import type { RecallEntry } from "@/lib/types";
```

Add state:
```tsx
const [recallMap, setRecallMap] = useState<Record<number, boolean>>({});
const [recallOpen, setRecallOpen] = useState<number | null>(null);
```

Inside `fetchOwnedProducts`, after building the `owned` array, add:
```tsx
const recallResults = await Promise.all(
  owned.map(async (p) => {
    try {
      const r = await contract.getRecall(p.id);
      return [p.id, r.active] as [number, boolean];
    } catch { return [p.id, false] as [number, boolean]; }
  })
);
setRecallMap(Object.fromEntries(recallResults));
```

Pass `isRecalled={!!recallMap[p.id]}` to each `<ProductCard>`.

Add `<IssueRecallModal>` portal near the bottom of the JSX (outside the map):
```tsx
{recallOpen !== null && (
  <IssueRecallModal
    productId={recallOpen}
    isRecalled={!!recallMap[recallOpen]}
    open={true}
    onClose={() => setRecallOpen(null)}
    onSuccess={fetchOwnedProducts}
  />
)}
```

When `walletState.role === "MANUFACTURER"`, also add a small "Recall" action button inside each ProductCard's action area — pass `onRecall={() => setRecallOpen(p.id)}` as a prop and wire it up inside ProductCard.

## Acceptance checks

- [ ] `npx hardhat test` inside `hardhat-project/` passes (8 new tests; total ≥ 43).
- [ ] Contract is redeployed and `.env.local` updated.
- [ ] Issuing a recall from the track page shows `RecallBanner` on both `/track/[id]` and `/verify?id=[id]`.
- [ ] Lifting the recall removes the `RecallBanner` on both pages.
- [ ] The dashboard shows a red "RECALLED" badge on the ProductCard for recalled products.
- [ ] Non-MANUFACTURER wallets do not see the "Issue Recall" button.
- [ ] MANUFACTURER wallet can issue and lift recalls without error.
- [ ] `npm run build` exits with 0 TypeScript errors.

## STOP — request user review

After finishing, post exactly: `Phase 24 complete — requesting review.`
