# Phase 17 — Audit filters (PROPOSAL PARITY)

## Goal
Part 1 §5.2.1 promises an "audit dashboard with comprehensive records which can be filtered by product or batch or date range". This phase adds that filter bar above the existing Phase 13 audit table. Filters combine (AND) and are kept in the URL (`useSearchParams`) so a filter view can be shared as a link.

## Files in scope (ALLOWED to create/edit)
- `frontend/app/audit/_components/FilterBar.tsx` (new)
- `frontend/app/audit/page.tsx`

## Files OUT of scope
- Everything else.

## Dependencies
None new.

## Implementation steps

### 1. `frontend/app/audit/_components/FilterBar.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

export interface AuditFilters {
  productId: string;
  batchNumber: string;
  from: string;
  to: string;
  action: string;
}

interface FilterBarProps {
  actions: string[];
  onChange: (f: AuditFilters) => void;
}

const empty: AuditFilters = { productId: "", batchNumber: "", from: "", to: "", action: "" };

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const activeCount = Object.values(local).filter(Boolean).length;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          Filters {activeCount > 0 && <span className="ml-1 text-indigo-300">({activeCount} active)</span>}
        </p>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" icon={<X className="w-4 h-4" />} onClick={() => setLocal(empty)}>
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <Label>Product ID</Label>
          <Input type="number" min={1} value={local.productId} onChange={(e) => setLocal({ ...local, productId: e.target.value })} placeholder="Any" />
        </div>
        <div>
          <Label>Batch</Label>
          <Input mono value={local.batchNumber} onChange={(e) => setLocal({ ...local, batchNumber: e.target.value })} placeholder="Any" />
        </div>
        <div>
          <Label>From</Label>
          <Input type="date" value={local.from} onChange={(e) => setLocal({ ...local, from: e.target.value })} />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" value={local.to} onChange={(e) => setLocal({ ...local, to: e.target.value })} />
        </div>
        <div>
          <Label>Action</Label>
          <Select value={local.action} onChange={(e) => setLocal({ ...local, action: e.target.value })}>
            <option value="">Any</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}
```

### 2. Wire into `frontend/app/audit/page.tsx`

Replace the current component body with the filter-aware version:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { StatusDonut } from "./_components/StatusDonut";
import { AuditTable, type AuditRow } from "./_components/AuditTable";
import { ExportButton } from "./_components/ExportButton";
import { FilterBar, type AuditFilters } from "./_components/FilterBar";

type RowWithProduct = AuditRow & { batch_number?: string };

export default function AuditPage() {
  const toast = useToast();
  const [rows, setRows]     = useState<RowWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({ productId: "", batchNumber: "", from: "", to: "", action: "" });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setRows((json.data ?? []) as RowWithProduct[]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load audit log");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const distinctActions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.action))).sort(),
    [rows]
  );

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

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Auditor / Regulator</p>
          <h1 className="text-3xl font-bold text-gradient">Audit Log</h1>
          <p className="text-gray-400 text-sm mt-1">
            Immutable ledger of every supply-chain event. Showing <span className="text-white font-medium">{filtered.length}</span> of {rows.length}.
          </p>
        </div>
        <ExportButton rows={filtered as unknown as Record<string, unknown>[]} />
      </header>

      <FilterBar actions={distinctActions} onChange={setFilters} />
      <StatusDonut rows={filtered} />
      {loading ? <p className="text-gray-400">Loading...</p> : <AuditTable rows={filtered} />}
    </div>
  );
}
```

> If the API response doesn't currently include `batch_number`, the batch filter becomes a no-op rather than an error — acceptable. If easy, have `/api/events` JOIN against `products` to return `batch_number`. This is optional for the grade but worth mentioning to the examiner in Phase 19 docs.

## Acceptance checks
- [ ] Five filter inputs appear above the donut/table: Product ID, Batch, From, To, Action.
- [ ] Entering a Product ID narrows the rows immediately.
- [ ] Setting From/To restricts rows to the date range (inclusive on both ends).
- [ ] Action dropdown contains one option per distinct action found in the data.
- [ ] Filter state is reflected in the URL; copy-pasting the URL restores the same view.
- [ ] "Clear all" resets every filter.
- [ ] The donut chart and CSV export update to reflect the currently filtered rows.

## STOP — request user review
After finishing, post exactly: `Phase 17 complete — requesting review.`
