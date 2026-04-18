import type { ProductStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ProductStatus;
}

const colorMap: Record<ProductStatus, string> = {
  CREATED: "bg-blue-900 text-blue-200 border border-blue-700",
  IN_TRANSIT: "bg-amber-900 text-amber-200 border border-amber-700",
  DELIVERED: "bg-green-900 text-green-200 border border-green-700",
  SOLD: "bg-emerald-900 text-emerald-200 border border-emerald-700",
};

const labelMap: Record<ProductStatus, string> = {
  CREATED: "Created",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  SOLD: "Sold",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[status]}`}
    >
      {labelMap[status]}
    </span>
  );
}
