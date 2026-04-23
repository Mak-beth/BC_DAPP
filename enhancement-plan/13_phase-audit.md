# Phase 13 — Audit page polish

## Goal
Enhance the `/audit` page with: an animated data table (row-mount stagger), a small status-distribution donut chart at the top, and a CSV export button. The audit FILTER BAR is Phase 17 — do not touch filtering logic in this phase.

## Files in scope (ALLOWED to create/edit)
- `frontend/app/audit/page.tsx`
- `frontend/app/audit/_components/StatusDonut.tsx` (new)
- `frontend/app/audit/_components/AuditTable.tsx` (new)
- `frontend/app/audit/_components/ExportButton.tsx` (new)

## Files OUT of scope
- Everything else.

## Dependencies
```bash
npm install recharts
```

## Implementation steps

First, open the existing `frontend/app/audit/page.tsx` to see how it currently fetches audit data and what shape the rows have (likely `{ product_id, actor_address, action, notes, created_at }` from `events_log`). Keep that fetch; swap the render only.

### 1. `frontend/app/audit/_components/StatusDonut.tsx`
```tsx
"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Row { action: string }

const palette = ["#818CF8", "#F59E0B", "#0EA5E9", "#34D399", "#A78BFA", "#F472B6"];

export function StatusDonut({ rows }: { rows: Row[] }) {
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] ?? 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Event Distribution</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#111726", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-300">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: palette[i % palette.length] }} />
            {d.name} <span className="text-gray-500">({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. `frontend/app/audit/_components/ExportButton.tsx`
```tsx
"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ExportButton({ rows }: { rows: Record<string, unknown>[] }) {
  function download() {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v).replaceAll('"', '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={download}>Export CSV</Button>;
}
```

### 3. `frontend/app/audit/_components/AuditTable.tsx`
```tsx
"use client";
import { motion } from "framer-motion";

export interface AuditRow {
  id: number;
  product_id: number;
  actor_address: string;
  action: string;
  notes: string | null;
  created_at: string;
}

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  if (rows.length === 0) {
    return <p className="text-gray-400 text-sm italic">No audit events to show.</p>;
  }
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] border-b border-border-subtle">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="border-b border-border-subtle/60 last:border-b-0 hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-200 font-mono">#{r.product_id}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.actor_address.slice(0, 6)}…{r.actor_address.slice(-4)}</td>
                <td className="px-4 py-3 text-indigo-200">{r.action}</td>
                <td className="px-4 py-3 text-gray-400">{r.notes ?? "—"}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 4. Rewrite the render of `frontend/app/audit/page.tsx`

Preserve the existing `useEffect` fetch (probably hitting `/api/events`). Replace the render with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { StatusDonut } from "./_components/StatusDonut";
import { AuditTable, type AuditRow } from "./_components/AuditTable";
import { ExportButton } from "./_components/ExportButton";

export default function AuditPage() {
  const toast = useToast();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setRows((json.data ?? []) as AuditRow[]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load audit log");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Auditor / Regulator</p>
          <h1 className="text-3xl font-bold text-gradient">Audit Log</h1>
          <p className="text-gray-400 text-sm mt-1">Immutable ledger of every supply-chain event.</p>
        </div>
        <ExportButton rows={rows as unknown as Record<string, unknown>[]} />
      </header>

      <StatusDonut rows={rows} />

      {loading ? <p className="text-gray-400">Loading audit events...</p> : <AuditTable rows={rows} />}
    </div>
  );
}
```

> If the existing endpoint path is not `/api/events`, preserve that path instead.

## Acceptance checks
- [ ] `/audit` shows a donut chart summarising event actions by count.
- [ ] Audit rows fade in staggered as they render.
- [ ] "Export CSV" downloads a `.csv` containing the current rows.
- [ ] Errors show as toasts.

## STOP — request user review
After finishing, post exactly: `Phase 13 complete — requesting review.`
