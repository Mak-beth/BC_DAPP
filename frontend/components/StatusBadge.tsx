import type { ProductStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

interface StatusBadgeProps {
  status: ProductStatus;
  pulse?: boolean;
}

const colorMap: Record<ProductStatus, string> = {
  CREATED:    "bg-indigo-500/15 text-indigo-200 border border-indigo-500/40",
  IN_TRANSIT: "bg-amber-500/15  text-amber-200  border border-amber-500/40",
  DELIVERED:  "bg-sky-500/15    text-sky-200    border border-sky-500/40",
  SOLD:       "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
};
const labelMap: Record<ProductStatus, string> = {
  CREATED: "Created", IN_TRANSIT: "In Transit", DELIVERED: "Delivered", SOLD: "Sold",
};

export default function StatusBadge({ status, pulse }: StatusBadgeProps) {
  const autoPulse = pulse ?? status === "IN_TRANSIT";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
      colorMap[status],
      autoPulse && "animate-pulse-glow"
    )}>
      {autoPulse && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {labelMap[status]}
    </span>
  );
}
