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
                done    && !active && "bg-[color:var(--role-ret)]/20 border border-[color:var(--role-ret)]/50 text-[color:var(--role-ret)]",
                active  && "bg-[color:var(--sig-1)]/25 border border-[color:var(--sig-1)]/70 text-white shadow-sig",
                !done   && "bg-white/[0.04] border border-border-subtle text-gray-500"
              )}>
                {i + 1}
                {active && <motion.span initial={{ scale: 0.9, opacity: 0.8 }} animate={{ scale: 1.25, opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity }} className="absolute inset-0 rounded-full ring-2 ring-[color:var(--sig-1)]/60" />}
              </div>
              <span className={cn("mt-1.5 text-[11px] uppercase tracking-wide truncate", active ? "text-white font-semibold" : done ? "text-[color:var(--role-ret)]" : "text-gray-500")}>
                {labels[s]}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="flex-1 h-px bg-border-subtle relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: i < idx ? "100%" : "0%" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-y-0 left-0 bg-[color:var(--role-ret)]"
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
