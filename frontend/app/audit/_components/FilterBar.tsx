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
