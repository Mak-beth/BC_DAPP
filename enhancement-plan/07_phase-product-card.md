# Phase 07 — ProductCard polish

## Goal
Upgrade the existing `ProductCard.tsx` component (and the inline card in `Dashboard`) with a gradient border that appears on hover, a subtle 3-deg tilt, a pulsing IN_TRANSIT badge, and a shimmer skeleton variant. Cards fade up in a staggered sequence when the dashboard loads.

## Files in scope (ALLOWED to create/edit)
- `frontend/components/ProductCard.tsx`
- `frontend/components/ProductCardSkeleton.tsx` (new)
- `frontend/components/StatusBadge.tsx` (add `pulse` prop)
- `frontend/app/dashboard/page.tsx` (swap inline JSX for the new component + stagger parent)

## Files OUT of scope
- Everything else.

## Dependencies
None new.

## Implementation steps

### 1. `frontend/components/StatusBadge.tsx` — add `pulse` prop
```tsx
import type { ProductStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

interface StatusBadgeProps {
  status: ProductStatus;
  pulse?: boolean;
}

const colorMap: Record<ProductStatus, string> = {
  CREATED:    "bg-indigo-500/15 text-indigo-200 border border-indigo-500/40",
  IN_TRANSIT: "bg-amber-500/15  text-amber-200  border border-amber-500/40",
  DELIVERED:  "bg-sky-500/15    text-sky-200    border border-sky-500/40",
  SOLD:       "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
};
const labelMap: Record<ProductStatus, string> = {
  CREATED: "Created", IN_TRANSIT: "In Transit", DELIVERED: "Delivered", SOLD: "Sold",
};

export default function StatusBadge({ status, pulse }: StatusBadgeProps) {
  const autoPulse = pulse ?? status === "IN_TRANSIT";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
      colorMap[status],
      autoPulse && "animate-pulse-glow"
    )}>
      {autoPulse && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {labelMap[status]}
    </span>
  );
}
```

### 2. `frontend/components/ProductCard.tsx` — upgrade
```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { DbProduct, ProductStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";

interface ProductCardProps {
  product: DbProduct;
  status?: ProductStatus;
}

export default function ProductCard({ product, status }: ProductCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -3, rotate: 0.4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="group relative rounded-xl p-[1px] bg-gradient-to-br from-white/10 to-white/5 hover:from-indigo-400/60 hover:to-cyan-400/40 transition-colors"
    >
      <div className="h-full rounded-[11px] bg-bg-raised/90 backdrop-blur-xl border border-border-subtle p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-lg font-bold text-white leading-tight">{product.name}</h2>
          {status && <StatusBadge status={status} />}
        </div>
        <div className="space-y-1 text-sm text-gray-400 flex-1">
          <p><span className="text-gray-500">Batch:</span> <span className="font-mono text-gray-300">{product.batch_number || "N/A"}</span></p>
          <p><span className="text-gray-500">Origin:</span> {product.origin_country || "N/A"}</p>
          <p><span className="text-gray-500">Created:</span> {new Date(product.created_at).toLocaleDateString()}</p>
        </div>
        <Link href={`/track/${product.chain_product_id}`} className="block">
          <Button size="sm" className="w-full">Track Product</Button>
        </Link>
      </div>
    </motion.div>
  );
}
```

### 3. `frontend/components/ProductCardSkeleton.tsx` (new)
```tsx
export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-raised/60 p-5 flex flex-col gap-3 overflow-hidden">
      <div className="h-5 w-2/3 rounded bg-white/5 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] bg-[length:200%_100%]" />
      <div className="space-y-2">
        <div className="h-3 w-1/2 rounded bg-white/5 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] bg-[length:200%_100%]" />
        <div className="h-3 w-1/3 rounded bg-white/5 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] bg-[length:200%_100%]" />
      </div>
      <div className="h-8 w-full rounded-md bg-white/5 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] bg-[length:200%_100%]" />
    </div>
  );
}
```

### 4. `frontend/app/dashboard/page.tsx` — use the component + stagger
- Import:
  ```tsx
  import { motion } from "framer-motion";
  import ProductCard from "@/components/ProductCard";
  import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
  ```
- Replace the inline card JSX inside the `.map` with the `<ProductCard>` component. Because `ProductCard` takes `DbProduct` + `status`, you'll need to adapt the on-chain Product into a `DbProduct`-shape for the card — build a minimal object:
  ```tsx
  <ProductCard
    key={p.id}
    product={{
      id: p.id,
      name: p.name,
      description: null,
      origin_country: p.origin,
      batch_number: p.batchNumber,
      created_at: new Date(p.createdAt * 1000).toISOString(),
      chain_product_id: p.id,
      creator_wallet: walletState.address ?? null,
    } as DbProduct}
    status={p.status}
  />
  ```
- Wrap the grid in a `motion.div` with stagger:
  ```tsx
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  >
    {products.map(...)}
  </motion.div>
  ```
- While `loading`, render 6 `<ProductCardSkeleton>` in the same grid instead of the plain "Loading products..." text.

## Acceptance checks
- [ ] Product cards appear in staggered sequence (not all at once) when dashboard loads.
- [ ] Hovering a card: 1px border turns indigo-cyan gradient; card lifts slightly with a tiny tilt.
- [ ] IN_TRANSIT badge has a gentle pulsing ring; other status badges do not.
- [ ] While data loads, 6 shimmering skeleton cards render in the same grid layout.
- [ ] `npm run build` clean.

## STOP — request user review
After finishing, post exactly: `Phase 07 complete — requesting review.`
