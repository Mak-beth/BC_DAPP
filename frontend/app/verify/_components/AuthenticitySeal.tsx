"use client";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export function AuthenticitySeal() {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 14 }}
      className="relative grid place-items-center w-24 h-24 mx-auto"
    >
      <span className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--verified) 40%, transparent) 0%, transparent 70%)" }} />
      <span className="absolute inset-0 rounded-full p-[2px]"
        style={{ background: "linear-gradient(135deg, var(--verified), var(--sig-3))" }}>
        <span className="block w-full h-full rounded-full bg-bg-raised" />
      </span>
      <ShieldCheck className="relative w-10 h-10" style={{ color: "var(--verified)" }} />
    </motion.div>
  );
}
