"use client";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { shortenAddress } from "@/lib/contract";
import type { RecallEntry } from "@/lib/types";

interface Props { recall: RecallEntry; }

export function RecallBanner({ recall }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl border p-4"
      style={{
        background: "rgba(239,68,68,0.08)",
        borderColor: "rgba(239,68,68,0.35)",
      }}
    >
      <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
      <div className="space-y-0.5">
        <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
          PRODUCT RECALLED
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {recall.reason}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Issued by {shortenAddress(recall.issuedBy)} &middot;{" "}
          {new Date(recall.timestamp * 1000).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}
