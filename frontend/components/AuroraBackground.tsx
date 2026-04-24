"use client";

export function AuroraBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
      {/* Big signature blob */}
      <div
        className="absolute -top-40 -left-40 w-[55rem] h-[55rem] rounded-full blur-3xl opacity-60 animate-aurora-drift"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sig-1) 35%, transparent), transparent 70%)" }}
      />
      {/* Accent blob */}
      <div
        className="absolute -bottom-40 -right-40 w-[50rem] h-[50rem] rounded-full blur-3xl opacity-50 animate-aurora-drift"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sig-3) 30%, transparent), transparent 70%)", animationDelay: "6s" }}
      />
      {/* Mid accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] rounded-full blur-3xl opacity-25 animate-aurora-drift"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sig-2) 40%, transparent), transparent 70%)", animationDelay: "12s" }}
      />
      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />
    </div>
  );
}
