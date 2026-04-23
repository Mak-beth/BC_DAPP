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
