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
