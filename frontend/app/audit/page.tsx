"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { StatusDonut } from "./_components/StatusDonut";
import { AuditTable, type AuditRow } from "./_components/AuditTable";
import { ExportButton } from "./_components/ExportButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { FilterBar, type AuditFilters } from "./_components/FilterBar";

type RowWithProduct = AuditRow & { batch_number?: string };

export default function AuditPage() {
  const toast = useToast();
  const [rows, setRows] = useState<RowWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({ productId: "", batchNumber: "", from: "", to: "", action: "" });

  useEffect(() => {
    async function load() {
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
    }
    load();
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : <AuditTable rows={filtered} />}
    </div>
  );
}
