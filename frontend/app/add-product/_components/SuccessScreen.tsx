"use client";
import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductQR } from "@/components/ProductQR";

export function SuccessScreen({ productId }: { productId: number }) {
  useEffect(() => {
    const colors = ["#818CF8", "#22D3EE", "#34D399"];
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.3 }, colors });
  }, []);

  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div className="grid place-items-center w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-400/40 shadow-[0_0_48px_rgba(52,211,153,0.35)]">
        <CheckCircle2 className="w-10 h-10 text-emerald-300" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gradient">Product registered on-chain</h1>
        <p className="text-gray-400 mt-2">Product ID: <span className="font-mono text-white">#{productId}</span></p>
      </div>

      <div className="flex justify-center">
        <ProductQR productId={productId} size={176} />
      </div>

      <div className="flex justify-center gap-3">
        <Link href={`/track/${productId}`}><Button>Go to track page</Button></Link>
        <Link href="/dashboard"><Button variant="secondary">Back to dashboard</Button></Link>
      </div>
    </div>
  );
}
