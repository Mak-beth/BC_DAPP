"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function ScannerFrame({ children }: { children: ReactNode }) {
  const corner = "absolute w-6 h-6 border-indigo-400";
  return (
    <div className="relative rounded-2xl border border-border-subtle bg-bg-raised/40 backdrop-blur-xl p-8">
      <span className={`${corner} top-2 left-2 border-t-2 border-l-2 rounded-tl-lg`} />
      <span className={`${corner} top-2 right-2 border-t-2 border-r-2 rounded-tr-lg`} />
      <span className={`${corner} bottom-2 left-2 border-b-2 border-l-2 rounded-bl-lg`} />
      <span className={`${corner} bottom-2 right-2 border-b-2 border-r-2 rounded-br-lg`} />
      <motion.span
        aria-hidden
        initial={{ y: 0 }}
        animate={{ y: [0, 40, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-6 right-6 top-10 h-px bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent"
      />
      {children}
    </div>
  );
}
