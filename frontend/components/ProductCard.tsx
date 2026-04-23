"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { DbProduct, ProductStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";

interface ProductCardProps {
  product: DbProduct;
  status?: ProductStatus;
}

export default function ProductCard({ product, status }: ProductCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -3, rotate: 0.4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="group relative rounded-xl p-[1px] bg-gradient-to-br from-white/10 to-white/5 hover:from-indigo-400/60 hover:to-cyan-400/40 transition-colors"
    >
      <div className="h-full rounded-[11px] bg-bg-raised/90 backdrop-blur-xl border border-border-subtle p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-lg font-bold text-white leading-tight">{product.name}</h2>
          {status && <StatusBadge status={status} />}
        </div>
        <div className="space-y-1 text-sm text-gray-400 flex-1">
          <p><span className="text-gray-500">Batch:</span> <span className="font-mono text-gray-300">{product.batch_number || "N/A"}</span></p>
          <p><span className="text-gray-500">Origin:</span> {product.origin_country || "N/A"}</p>
          <p><span className="text-gray-500">Created:</span> {new Date(product.created_at).toLocaleDateString()}</p>
        </div>
        <Link href={`/track/${product.chain_product_id}`} className="block">
          <Button size="sm" className="w-full">Track Product</Button>
        </Link>
      </div>
    </motion.div>
  );
}
