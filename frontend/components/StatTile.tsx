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

const accentMap = {
  indigo:  { bg: "var(--sig-1)",    text: "var(--sig-1)" },
  amber:   { bg: "var(--role-mfr)", text: "var(--role-mfr)" },
  sky:     { bg: "var(--sig-3)",    text: "var(--sig-3)" },
  emerald: { bg: "var(--role-ret)", text: "var(--role-ret)" },
} as const;

export function StatTile({ label, value, icon, accent = "indigo" }: StatTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-4"
    >
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-60"
        style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${accentMap[accent].bg} 40%, transparent), transparent 70%)` }}
      />
      <div className="relative flex items-center gap-3">
        {icon && (
          <div
            className="grid place-items-center w-10 h-10 rounded-lg"
            style={{ background: `color-mix(in srgb, ${accentMap[accent].bg} 18%, transparent)`, color: accentMap[accent].text }}
          >
            {icon}
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
