export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-raised/60 p-5 flex flex-col gap-3 overflow-hidden">
      <div className="h-5 w-2/3 rounded bg-white/5 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] bg-[length:200%_100%]" />
      <div className="space-y-2">
        <div className="h-3 w-1/2 rounded bg-white/5 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] bg-[length:200%_100%]" />
        <div className="h-3 w-1/3 rounded bg-white/5 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] bg-[length:200%_100%]" />
      </div>
      <div className="h-8 w-full rounded-md bg-white/5 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] bg-[length:200%_100%]" />
    </div>
  );
}
