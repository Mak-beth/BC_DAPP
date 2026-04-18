import Link from "next/link";
import type { DbProduct } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import type { ProductStatus } from "@/lib/types";

interface ProductCardProps {
  product: DbProduct;
  status?: ProductStatus;
}

export default function ProductCard({ product, status }: ProductCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-bold text-white leading-tight">{product.name}</h2>
        {status && <StatusBadge status={status} />}
      </div>

      <div className="space-y-1 text-sm text-gray-400 flex-1">
        <p>
          <span className="text-gray-500">Batch:</span> {product.batch_number || "N/A"}
        </p>
        <p>
          <span className="text-gray-500">Origin:</span> {product.origin_country || "N/A"}
        </p>
        <p>
          <span className="text-gray-500">Created:</span>{" "}
          {new Date(product.created_at).toLocaleDateString()}
        </p>
      </div>

      <Link
        href={`/track/${product.chain_product_id}`}
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors text-center"
      >
        Track Product
      </Link>
    </div>
  );
}
