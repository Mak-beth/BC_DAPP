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
