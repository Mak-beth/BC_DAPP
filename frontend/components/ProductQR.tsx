"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ProductQR({ productId, size = 160 }: { productId: number; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  const verifyUrl =
    typeof window === "undefined" ? `/verify?id=${productId}` : `${window.location.origin}/verify?id=${productId}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, verifyUrl, {
      width: size,
      margin: 1,
      color: { dark: "#0B0F1A", light: "#FFFFFF" },
    });
    QRCode.toDataURL(verifyUrl, { width: 512, margin: 2 }).then(setDataUrl);
  }, [verifyUrl, size]);

  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.03] backdrop-blur-xl p-4 flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-md bg-white p-1" width={size} height={size} role="img" aria-label="QR code for product verification" />
      <p className="text-[11px] font-mono text-gray-500 break-all text-center">{verifyUrl}</p>
      {dataUrl && (
        <a href={dataUrl} download={`product-${productId}-qr.png`}>
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>Download PNG</Button>
        </a>
      )}
    </div>
  );
}
