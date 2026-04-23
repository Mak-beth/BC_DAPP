# Phase 11 — Verify page redesign

## Goal
Rebuild `/verify` as a dramatic, scanner-styled public page. The search input is centered, oversized, framed with animated corner brackets. On a successful verification, the result card slides up with an "Authenticity Seal" SVG (gradient ring + check). No QR scanning logic yet — Phase 16 adds it.

## Files in scope (ALLOWED to create/edit)
- `frontend/app/verify/page.tsx`
- `frontend/app/verify/_components/ScannerFrame.tsx` (new)
- `frontend/app/verify/_components/AuthenticitySeal.tsx` (new)

## Files OUT of scope
- Everything else.

## Dependencies
None new.

## Implementation steps

### 1. `frontend/app/verify/_components/ScannerFrame.tsx`
```tsx
"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function ScannerFrame({ children }: { children: ReactNode }) {
  const corner = "absolute w-6 h-6 border-indigo-400";
  return (
    <div className="relative rounded-2xl border border-border-subtle bg-bg-raised/40 backdrop-blur-xl p-8">
      <span className={`${corner} top-2 left-2 border-t-2 border-l-2 rounded-tl-lg`} />
      <span className={`${corner} top-2 right-2 border-t-2 border-r-2 rounded-tr-lg`} />
      <span className={`${corner} bottom-2 left-2 border-b-2 border-l-2 rounded-bl-lg`} />
      <span className={`${corner} bottom-2 right-2 border-b-2 border-r-2 rounded-br-lg`} />
      <motion.span
        aria-hidden
        initial={{ y: 0 }}
        animate={{ y: [0, 40, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-6 right-6 top-10 h-px bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent"
      />
      {children}
    </div>
  );
}
```

### 2. `frontend/app/verify/_components/AuthenticitySeal.tsx`
```tsx
"use client";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export function AuthenticitySeal() {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 14 }}
      className="relative grid place-items-center w-24 h-24 mx-auto"
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 to-sky-400/30 blur-xl" />
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/60 to-sky-500/60 p-[2px]">
        <span className="block w-full h-full rounded-full bg-bg-raised" />
      </span>
      <ShieldCheck className="relative w-10 h-10 text-emerald-300" />
    </motion.div>
  );
}
```

### 3. Rewrite `frontend/app/verify/page.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getContract, statusIndexToString } from "@/lib/contract";
import type { DbProduct, ProductStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ScannerFrame } from "./_components/ScannerFrame";
import { AuthenticitySeal } from "./_components/AuthenticitySeal";

interface VerifyData {
  exists: boolean;
  currentOwner: string;
  status: ProductStatus;
  dbProduct: DbProduct | null;
}

export default function VerifyPage() {
  const toast = useToast();
  const [productId, setProductId] = useState("");
  const [result, setResult] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(false);

  async function runVerify(rawId: string) {
    const id = rawId.trim();
    if (!id || isNaN(Number(id)) || Number(id) <= 0) {
      toast.error("Enter a valid product ID (positive number)");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const contract = await getContract(false);
      const [exists, currentOwner, statusIndex] = await contract.verifyProduct(id);
      let dbProduct: DbProduct | null = null;
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) dbProduct = (await res.json()).data ?? null;
      } catch {/* off-chain optional */}
      setResult({ exists, currentOwner, status: statusIndexToString(statusIndex), dbProduct });
    } catch {
      toast.error("Product not found on the blockchain.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-gradient">Verify a Product</h1>
        <p className="text-gray-400 text-sm mt-2">
          No wallet required. Enter a product ID to check its authenticity on the blockchain.
        </p>
      </header>

      <ScannerFrame>
        <form
          onSubmit={(e) => { e.preventDefault(); runVerify(productId); }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Input
            type="number"
            min={1}
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Product ID (e.g. 1)"
            className="h-12 text-lg"
          />
          <Button type="submit" size="lg" loading={loading}>Verify</Button>
        </form>
      </ScannerFrame>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            className="rounded-2xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-6 space-y-5"
          >
            <AuthenticitySeal />
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">
                {result.dbProduct?.name ?? `Product #${productId}`}
              </h2>
              {result.dbProduct?.batch_number && (
                <p className="text-xs text-gray-400 font-mono mt-1">Batch: {result.dbProduct.batch_number}</p>
              )}
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-200 border border-emerald-500/40">
                  Verified on-chain
                </span>
                <StatusBadge status={result.status} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Current Owner</p>
                <p className="text-gray-200 font-mono break-all">{result.currentOwner}</p>
              </div>
              {result.dbProduct?.origin_country && (
                <div>
                  <p className="text-gray-500 mb-1">Origin Country</p>
                  <p className="text-gray-200">{result.dbProduct.origin_country}</p>
                </div>
              )}
              {result.dbProduct?.description && (
                <div className="md:col-span-2">
                  <p className="text-gray-500 mb-1">Description</p>
                  <p className="text-gray-200">{result.dbProduct.description}</p>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-border-subtle flex justify-end">
              <Link href={`/track/${productId}`}>
                <Button variant="secondary" size="sm">View Full History →</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

## Acceptance checks
- [ ] The input sits inside a dark frame with four glowing indigo corner brackets and a subtle scan-line sweeping up and down.
- [ ] After a successful verify, the result card slides up; above the product name is an animated "Authenticity Seal" (gradient ring + shield check).
- [ ] Invalid / not-found ID shows a toast error; no inline red banner.
- [ ] "View Full History →" navigates to `/track/<id>`.

## STOP — request user review
After finishing, post exactly: `Phase 11 complete — requesting review.`
