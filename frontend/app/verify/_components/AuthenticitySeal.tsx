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
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 to-sky-400/30 blur-xl" />
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/60 to-sky-500/60 p-[2px]">
        <span className="block w-full h-full rounded-full bg-bg-raised" />
      </span>
      <ShieldCheck className="relative w-10 h-10 text-emerald-300" />
    </motion.div>
  );
}
