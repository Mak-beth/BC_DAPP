# Phase 08 — Dashboard redesign

## Goal
Transform `/dashboard` from a plain list into a premium overview: a role-aware hero greeting, four stat tiles (Total / In Transit / Delivered / Sold), a search-by-name filter, and a proper empty-state illustration with a call to action.

## Files in scope (ALLOWED to create/edit)
- `frontend/app/dashboard/page.tsx`
- `frontend/components/StatTile.tsx` (new)
- `frontend/components/EmptyState.tsx` (new)

## Files OUT of scope
- Anything else (ProductCard already done in Phase 07).

## Dependencies
None new.

## Implementation steps

### 1. `frontend/components/StatTile.tsx`
```tsx
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatTileProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accent?: "indigo" | "amber" | "sky" | "emerald";
}

const accentMap: Record<NonNullable<StatTileProps["accent"]>, string> = {
  indigo:  "from-indigo-500/30 to-indigo-500/5 text-indigo-300",
  amber:   "from-amber-500/30 to-amber-500/5 text-amber-300",
  sky:     "from-sky-500/30 to-sky-500/5 text-sky-300",
  emerald: "from-emerald-500/30 to-emerald-500/5 text-emerald-300",
};

export function StatTile({ label, value, icon, accent = "indigo" }: StatTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-4"
    >
      <div className={cn("absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl bg-gradient-to-br opacity-60", accentMap[accent])} />
      <div className="relative flex items-center gap-3">
        {icon && <div className={cn("grid place-items-center w-10 h-10 rounded-lg bg-gradient-to-br", accentMap[accent])}>{icon}</div>}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
```

### 2. `frontend/components/EmptyState.tsx`
```tsx
import { PackageOpen } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-white/[0.02] p-10 flex flex-col items-center text-center gap-4">
      <div className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-cyan-500/20 border border-indigo-400/40">
        <PackageOpen className="w-8 h-8 text-indigo-200" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-md">{description}</p>
      </div>
      {action}
    </div>
  );
}
```

### 3. Rewrite `frontend/app/dashboard/page.tsx`
Keep the existing on-chain fetch logic but replace the render block. The complete file:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Boxes, Truck, PackageCheck, Coins, Search } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import { getContract, statusIndexToString } from "@/lib/contract";
import type { Product, DbProduct } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { StatTile } from "@/components/StatTile";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function Dashboard() {
  const { walletState } = useWallet();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(false);
  const [query, setQuery]       = useState("");

  useEffect(() => {
    async function fetchOwnedProducts() {
      if (!walletState.isConnected || !walletState.address) return;
      setLoading(true);
      try {
        const contract = await getContract(false);
        const total = Number(await contract.getTotalProducts());
        if (total === 0) { setProducts([]); return; }
        const ids = Array.from({ length: total }, (_, i) => i + 1);
        const all = await Promise.all(ids.map((id) => contract.getProduct(id)));
        const owned: Product[] = all
          .filter((p) => p.currentOwner.toLowerCase() === walletState.address!.toLowerCase())
          .map((p) => ({
            id: Number(p.id),
            name: p.name,
            origin: p.origin,
            batchNumber: p.batchNumber,
            currentOwner: p.currentOwner,
            status: statusIndexToString(p.status),
            createdAt: Number(p.createdAt),
          }));
        setProducts(owned);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    fetchOwnedProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletState.address, walletState.isConnected]);

  const stats = useMemo(() => ({
    total:      products.length,
    inTransit:  products.filter((p) => p.status === "IN_TRANSIT").length,
    delivered:  products.filter((p) => p.status === "DELIVERED").length,
    sold:       products.filter((p) => p.status === "SOLD").length,
  }), [products]);

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim().toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.batchNumber.toLowerCase().includes(q) ||
      p.origin.toLowerCase().includes(q)
    );
  }, [products, query]);

  if (!walletState.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-3xl font-bold text-gradient mb-3">Dashboard</h1>
        <p className="text-gray-400">Connect your wallet to view products you own.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-gray-400">Welcome back</p>
        <h1 className="text-3xl font-bold text-gradient">Your Supply Chain</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Role: <span className="font-semibold text-white">{walletState.role}</span>
          {" · "}
          <span className="font-mono text-gray-500">{walletState.address}</span>
        </p>
      </motion.header>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total"      value={stats.total}     icon={<Boxes className="w-5 h-5" />}        accent="indigo" />
        <StatTile label="In Transit" value={stats.inTransit} icon={<Truck className="w-5 h-5" />}        accent="amber" />
        <StatTile label="Delivered"  value={stats.delivered} icon={<PackageCheck className="w-5 h-5" />} accent="sky" />
        <StatTile label="Sold"       value={stats.sold}      icon={<Coins className="w-5 h-5" />}        accent="emerald" />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search by name, batch, origin…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "No matches" : "No products yet"}
          description={query ? "Try a different search term." : "When you own products on-chain, they'll show up here."}
          action={
            walletState.role === "MANUFACTURER" && !query ? (
              <Link href="/add-product"><Button>Create your first product</Button></Link>
            ) : null
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((p) => (
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
              } as unknown as DbProduct}
              status={p.status}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
```

## Acceptance checks
- [ ] A connected wallet sees a greeting "Welcome back" + gradient heading + their role + their address in mono.
- [ ] Four stat tiles show total/inTransit/delivered/sold counts matching the products list.
- [ ] Search input filters cards live.
- [ ] Empty state shows an illustration and a CTA if the user is a manufacturer.
- [ ] Loading shows 6 skeleton cards in the grid, not plain text.
- [ ] `npm run build` clean.

## STOP — request user review
After finishing, post exactly: `Phase 08 complete — requesting review.`
