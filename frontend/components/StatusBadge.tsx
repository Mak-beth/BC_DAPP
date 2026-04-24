import type { ProductStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

interface StatusBadgeProps { status: ProductStatus; pulse?: boolean; }

// Themed: CREATED uses sig-1 (signature), IN_TRANSIT uses sig-2, DELIVERED uses sig-3, SOLD uses verified gold.
const styleMap: Record<ProductStatus, string> = {
  CREATED:    "bg-[color:var(--sig-1)]/15     text-[color:var(--sig-1)]     border border-[color:var(--sig-1)]/40",
  IN_TRANSIT: "bg-[color:var(--sig-2)]/15     text-[color:var(--sig-2)]     border border-[color:var(--sig-2)]/40",
  DELIVERED:  "bg-[color:var(--sig-3)]/15     text-[color:var(--sig-3)]     border border-[color:var(--sig-3)]/40",
  SOLD:       "bg-[color:var(--verified)]/15  text-[color:var(--verified)]  border border-[color:var(--verified)]/40",
};
const labels: Record<ProductStatus, string> = { CREATED: "Created", IN_TRANSIT: "In Transit", DELIVERED: "Delivered", SOLD: "Sold" };

export default function StatusBadge({ status, pulse }: StatusBadgeProps) {
  const autoPulse = pulse ?? status === "IN_TRANSIT";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
      styleMap[status],
      autoPulse && "animate-pulse-glow"
    )}>
      {autoPulse && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {labels[status]}
    </span>
  );
}
