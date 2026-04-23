"use client";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";

export interface HistoryEntry {
  actor: string;
  action: string;
  timestamp: number;
}

export function HistoryTimeline({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ol className="relative pl-6">
      <motion.span
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "top" }}
        className="absolute left-[10px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-400/60 via-border-subtle to-transparent"
      />
      {entries.map((e, i) => {
        const isLatest = i === entries.length - 1;
        return (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            className="relative pb-5 last:pb-0"
          >
            <span className={cn(
              "absolute -left-6 top-1 grid place-items-center w-5 h-5 rounded-full border-2",
              isLatest ? "bg-indigo-500 border-indigo-300 animate-pulse-glow" : "bg-bg-raised border-border-strong"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", isLatest ? "bg-white" : "bg-gray-400")} />
            </span>
            <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {new Date(e.timestamp * 1000).toLocaleString()}
              </div>
              <p className="mt-1 text-sm text-white font-medium">{e.action}</p>
              <p className="text-xs text-gray-400 font-mono break-all mt-0.5">{e.actor}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
