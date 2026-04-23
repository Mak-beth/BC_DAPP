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
