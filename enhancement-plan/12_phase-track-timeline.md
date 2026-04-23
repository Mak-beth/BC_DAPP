# Phase 12 — Track page timeline

## Goal
Rebuild `/track/[id]` with a proper visual timeline: a horizontal status progress bar at the top (CREATED → IN_TRANSIT → DELIVERED → SOLD) with the current stage glowing, and below it a vertical timeline of every history entry — the connecting line draws in on mount, each node pulses when it is the latest.

Inspect the current `/track/[id]/page.tsx` first to learn what fields `getProduct` and `getHistory` return; keep those same calls — this phase only changes the render.

## Files in scope (ALLOWED to create/edit)
- `frontend/app/track/[id]/page.tsx`
- `frontend/app/track/[id]/_components/StatusProgressBar.tsx` (new)
- `frontend/app/track/[id]/_components/HistoryTimeline.tsx` (new)

## Files OUT of scope
- Everything else.

## Dependencies
None new.

## Implementation steps

### 1. `frontend/app/track/[id]/_components/StatusProgressBar.tsx`
```tsx
"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ProductStatus } from "@/lib/types";

const stages: ProductStatus[] = ["CREATED", "IN_TRANSIT", "DELIVERED", "SOLD"];
const labels: Record<ProductStatus, string> = {
  CREATED: "Created", IN_TRANSIT: "In Transit", DELIVERED: "Delivered", SOLD: "Sold",
};

export function StatusProgressBar({ current }: { current: ProductStatus }) {
  const idx = stages.indexOf(current);
  return (
    <ol className="flex items-center gap-3">
      {stages.map((s, i) => {
        const done   = i <= idx;
        const active = i === idx;
        return (
          <li key={s} className="flex-1 flex items-center gap-3 min-w-0">
            <div className="flex flex-col items-center min-w-0">
              <div className={cn(
                "relative grid place-items-center w-9 h-9 rounded-full text-xs font-bold transition-colors",
                done    && !active && "bg-emerald-500/20 border border-emerald-400/50 text-emerald-200",
                active  && "bg-indigo-500/25 border border-indigo-400/70 text-white shadow-glow",
                !done   && "bg-white/[0.04] border border-border-subtle text-gray-500"
              )}>
                {i + 1}
                {active && <motion.span initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1.25, opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity }} className="absolute inset-0 rounded-full ring-2 ring-indigo-400/60" />}
              </div>
              <span className={cn("mt-1.5 text-[11px] uppercase tracking-wide truncate", active ? "text-white font-semibold" : done ? "text-emerald-300" : "text-gray-500")}>
                {labels[s]}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="flex-1 h-px bg-border-subtle relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: i < idx ? "100%" : "0%" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500"
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

### 2. `frontend/app/track/[id]/_components/HistoryTimeline.tsx`
```tsx
"use client";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";

export interface HistoryEntry {
  actor: string;
  action: string;
  timestamp: number;
}

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
            <span className={cn(
              "absolute -left-6 top-1 grid place-items-center w-5 h-5 rounded-full border-2",
              isLatest ? "bg-indigo-500 border-indigo-300 animate-pulse-glow" : "bg-bg-raised border-border-strong"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", isLatest ? "bg-white" : "bg-gray-400")} />
            </span>
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

### 3. Rewrite `frontend/app/track/[id]/page.tsx`

Keep the existing read-only contract calls (`getProduct`, `getHistory`). Replace only the render. If the current file doesn't exist or is minimal, produce this full file:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getContract, statusIndexToString } from "@/lib/contract";
import type { ProductStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { StatusProgressBar } from "./_components/StatusProgressBar";
import { HistoryTimeline, type HistoryEntry } from "./_components/HistoryTimeline";

interface ProductView {
  id: number;
  name: string;
  origin: string;
  batchNumber: string;
  currentOwner: string;
  status: ProductStatus;
  createdAt: number;
}

export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const toast = useToast();
  const [product, setProduct] = useState<ProductView | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const contract = await getContract(false);
        const p = await contract.getProduct(id);
        const h = await contract.getHistory(id);
        setProduct({
          id: Number(p.id),
          name: p.name,
          origin: p.origin,
          batchNumber: p.batchNumber,
          currentOwner: p.currentOwner,
          status: statusIndexToString(p.status),
          createdAt: Number(p.createdAt),
        });
        setHistory(
          h.map((e: any) => ({ actor: e.actor, action: e.action, timestamp: Number(e.timestamp) }))
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p className="text-gray-400">Loading product from blockchain...</p>;
  if (!product) return <p className="text-gray-400">Product not found.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Product #{product.id}</p>
          <h1 className="text-3xl font-bold text-gradient">{product.name}</h1>
          <p className="text-xs text-gray-400 font-mono mt-1">Batch: {product.batchNumber}</p>
        </div>
        <StatusBadge status={product.status} />
      </header>

      <section className="rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-5">
        <StatusProgressBar current={product.status} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-4">
          <p className="text-gray-500 mb-1">Current Owner</p>
          <p className="text-gray-200 font-mono break-all">{product.currentOwner}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-4">
          <p className="text-gray-500 mb-1">Origin</p>
          <p className="text-gray-200">{product.origin}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-4 md:col-span-2">
          <p className="text-gray-500 mb-1">Created</p>
          <p className="text-gray-200">{new Date(product.createdAt * 1000).toLocaleString()}</p>
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-3">History</h2>
        <HistoryTimeline entries={history} />
      </section>
    </div>
  );
}
```

> Note: Phase 16 adds a `<ProductQR>` component to the header (top-right) and Phase 15 adds a "View certificate on IPFS" link; leave those slots alone now.

## Acceptance checks
- [ ] `/track/<id>` shows a horizontal 4-stage progress bar with the current stage glowing indigo and previous stages filled emerald.
- [ ] The connecting gradient line between stages animates in.
- [ ] History entries appear in a vertical timeline; the vertical line draws from top down on mount.
- [ ] The latest history entry has a pulsing indigo node; earlier entries have static grey nodes.
- [ ] Errors surface as toasts, not banners.

## STOP — request user review
After finishing, post exactly: `Phase 12 complete — requesting review.`
