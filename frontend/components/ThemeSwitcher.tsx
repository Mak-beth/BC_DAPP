"use client";

import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";

export function ThemeSwitcher() {
  const { theme, setTheme, list, labels } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-label="Change theme"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border-subtle bg-white/[0.04] text-content-subtle hover:text-white hover:border-border-strong transition-colors"
      >
        <Sparkles className="w-4 h-4" style={{ color: "var(--sig-1)" }} />
        <span className="text-xs font-medium">{labels[theme]}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-40 rounded-lg border border-border-strong surface-glass-strong p-1 z-50"
            onMouseLeave={() => setOpen(false)}
          >
            {list.map((t) => (
              <li key={t}>
                <button
                  onClick={() => { setTheme(t); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm",
                    t === theme ? "bg-white/10 text-white" : "text-content-subtle hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: `var(--sig-1)`, boxShadow: `0 0 8px var(--sig-1)` }} />
                  {labels[t]}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
