"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, ArrowRightCircle } from "lucide-react";
import type { DbProduct, ProductStatus, ContactRole } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { TransferOwnershipModal } from "@/components/TransferOwnershipModal";
import { UpdateStatusModal } from "@/components/UpdateStatusModal";

interface ProductCardProps {
  product: DbProduct;
  status?: ProductStatus;
  /** If the connected wallet owns this product, show Transfer + Update-Status actions. */
  canAct?: boolean;
  /** Role of the current wallet — drives which role is pre-selected when saving a new contact. */
  userRole?: ContactRole;
  onChanged?: () => void;
  /** Whether this product has an active on-chain recall. */
  isRecalled?: boolean;
  /** Called when the MANUFACTURER clicks the Recall button on this card. */
  onRecall?: () => void;
}

export default function ProductCard({ product, status, canAct, userRole, onChanged, isRecalled, onRecall }: ProductCardProps) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const suggestedRole: ContactRole =
    userRole === "MANUFACTURER" ? "DISTRIBUTOR"
    : userRole === "DISTRIBUTOR" ? "RETAILER"
    : "RETAILER";

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -3, rotate: 0.4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="group relative rounded-xl p-[1px] bg-gradient-to-br from-white/10 to-white/5 hover:from-violet-400/60 hover:to-cyan-400/40 transition-colors"
    >
      <div className="h-full rounded-[11px] bg-bg-raised/90 backdrop-blur-xl border border-border-subtle p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-lg font-bold text-white leading-tight">{product.name}</h2>
          <div className="flex flex-col items-end gap-1">
            {status && <StatusBadge status={status} />}
            {isRecalled && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                RECALLED
              </span>
            )}
          </div>
        </div>
        <div className="space-y-1 text-sm text-gray-400 flex-1">
          <p><span className="text-gray-500">Batch:</span> <span className="font-mono text-gray-300">{product.batch_number || "N/A"}</span></p>
          <p><span className="text-gray-500">Origin:</span> {product.origin_country || "N/A"}</p>
          <p><span className="text-gray-500">Created:</span> {new Date(product.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/track/${product.chain_product_id}`} className="flex-1">
            <Button size="sm" variant="secondary" className="w-full">Track</Button>
          </Link>
          {canAct && (
            <>
              <Button size="sm" icon={<Send className="w-4 h-4" />} onClick={() => setTransferOpen(true)}>Transfer</Button>
              <Button size="sm" variant="ghost" icon={<ArrowRightCircle className="w-4 h-4" />} onClick={() => setStatusOpen(true)}>Status</Button>
            </>
          )}
          {onRecall && (
            <Button size="sm" variant="danger" onClick={onRecall}>
              {isRecalled ? "Lift Recall" : "Recall"}
            </Button>
          )}
        </div>
      </div>

      {canAct && (
        <>
          <TransferOwnershipModal
            open={transferOpen}
            onClose={() => setTransferOpen(false)}
            productId={Number(product.chain_product_id)}
            suggestedRole={suggestedRole}
            onSuccess={() => { onChanged?.(); }}
          />
          <UpdateStatusModal
            open={statusOpen}
            onClose={() => setStatusOpen(false)}
            productId={Number(product.chain_product_id)}
            current={status ?? "CREATED"}
            onSuccess={() => { onChanged?.(); }}
          />
        </>
      )}
    </motion.div>
  );
}
