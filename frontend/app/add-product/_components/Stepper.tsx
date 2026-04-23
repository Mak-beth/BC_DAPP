"use client";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const steps = ["Details", "Certification", "Review"] as const;

export function Stepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="flex items-center gap-4 mb-8">
      {steps.map((label, i) => {
        const active = i === current;
        const done   = i < current;
        return (
          <li key={label} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "relative grid place-items-center w-8 h-8 rounded-full text-xs font-semibold transition-colors",
              done   && "bg-emerald-500/20 border border-emerald-400/50 text-emerald-200",
              active && "bg-indigo-500/20 border border-indigo-400/60 text-white shadow-glow",
              !done && !active && "bg-white/[0.04] border border-border-subtle text-gray-400"
            )}>
              {done ? <Check className="w-4 h-4" /> : i + 1}
              {active && <motion.span layoutId="step-pulse" className="absolute inset-0 rounded-full ring-2 ring-indigo-400/60" />}
            </div>
            <span className={cn("text-sm", active ? "text-white font-medium" : done ? "text-emerald-300" : "text-gray-500")}>
              {label}
            </span>
            {i < steps.length - 1 && <span className="flex-1 h-px bg-border-subtle" />}
          </li>
        );
      })}
    </ol>
  );
}
