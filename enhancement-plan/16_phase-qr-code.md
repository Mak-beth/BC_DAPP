# Phase 16 — QR code generate + scan (PROPOSAL PARITY)

## Goal
Part 1 of the assignment promises retailers/consumers will access product provenance via a **QR code**. This phase generates a QR on the track page and the add-product success screen, and adds a scanner to the verify page that accepts both **uploaded QR images** (default, because this is a desktop DApp) and **camera capture** (fallback).

## Files in scope (ALLOWED to create/edit)
- `frontend/components/ProductQR.tsx` (new)
- `frontend/components/QRScanner.tsx` (new)
- `frontend/app/track/[id]/page.tsx`
- `frontend/app/add-product/_components/SuccessScreen.tsx`
- `frontend/app/verify/page.tsx`

## Files OUT of scope
- Everything else.

## Dependencies
`qrcode` is already installed. Install the scanner:
```bash
npm install html5-qrcode
```

## Implementation steps

### 1. `frontend/components/ProductQR.tsx`
```tsx
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
      <canvas ref={canvasRef} className="rounded-md bg-white p-1" width={size} height={size} />
      <p className="text-[11px] font-mono text-gray-500 break-all text-center">{verifyUrl}</p>
      {dataUrl && (
        <a href={dataUrl} download={`product-${productId}-qr.png`}>
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>Download PNG</Button>
        </a>
      )}
    </div>
  );
}
```

### 2. `frontend/components/QRScanner.tsx` — TWO modes, upload default
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Upload, Camera } from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onResult: (decoded: string) => void;
}

type Tab = "upload" | "camera";

export function QRScanner({ open, onClose, onResult }: QRScannerProps) {
  const [tab, setTab] = useState<Tab>("upload");
  const [error, setError] = useState("");
  const cameraDivId = "qr-camera-region";
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // UPLOAD path
  async function handleFile(file: File) {
    setError("");
    try {
      const scanner = new Html5Qrcode("qr-hidden-region", { verbose: false, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] } as any);
      const text = await scanner.scanFile(file, true);
      await scanner.clear();
      onResult(text);
      onClose();
    } catch {
      setError("No QR code found in the image — try a clearer image.");
    }
  }

  // CAMERA path
  useEffect(() => {
    if (!open || tab !== "camera") return;
    let active = true;
    (async () => {
      try {
        const scanner = new Html5Qrcode(cameraDivId, false);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (decoded) => {
            if (!active) return;
            active = false;
            scanner.stop().then(() => scanner.clear()).catch(() => {});
            onResult(decoded);
            onClose();
          },
          () => {/* ignore continuous error frames */}
        );
      } catch {
        setError("Camera unavailable — please use the Upload tab instead.");
        setTab("upload");
      }
    })();
    return () => {
      active = false;
      const s = scannerRef.current;
      if (s) s.stop().then(() => s.clear()).catch(() => {});
      scannerRef.current = null;
    };
  }, [open, tab, onClose, onResult]);

  return (
    <Modal open={open} onClose={onClose} title="Scan QR code">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("upload")}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium border transition-colors",
            tab === "upload" ? "bg-indigo-500/20 border-indigo-400/60 text-white" : "bg-white/[0.03] border-border-subtle text-gray-300 hover:text-white"
          )}
        >
          <Upload className="w-4 h-4" /> Upload image
        </button>
        <button
          onClick={() => setTab("camera")}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium border transition-colors",
            tab === "camera" ? "bg-indigo-500/20 border-indigo-400/60 text-white" : "bg-white/[0.03] border-border-subtle text-gray-300 hover:text-white"
          )}
        >
          <Camera className="w-4 h-4" /> Use camera
        </button>
      </div>

      {tab === "upload" ? (
        <div>
          <label className="cursor-pointer block rounded-lg border-2 border-dashed border-border-strong bg-white/[0.02] hover:bg-white/[0.04] p-8 text-center text-sm text-gray-400">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <Upload className="w-6 h-6 mx-auto mb-2 text-indigo-300" />
            Click to choose a QR image (PNG, JPG, etc.)
          </label>
          <div id="qr-hidden-region" className="hidden" />
        </div>
      ) : (
        <div>
          <div id={cameraDivId} className="rounded-lg overflow-hidden border border-border-subtle bg-black" />
          <p className="text-xs text-gray-500 mt-2">Point your camera at a QR code. Scanning stops automatically on first read.</p>
        </div>
      )}

      {error && <p className="text-rose-400 text-sm mt-4">{error}</p>}

      <div className="flex justify-end mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}
```

### 3. Add QR to track page

In `frontend/app/track/[id]/page.tsx`, import `ProductQR` and place it in the header grid:

```tsx
import { ProductQR } from "@/components/ProductQR";
// inside the return, alongside the product details:
<div className="hidden md:block">
  <ProductQR productId={product.id} size={140} />
</div>
```

Place it in the header so it sits to the right of the product title block.

### 4. Replace placeholder on `SuccessScreen.tsx`

In `frontend/app/add-product/_components/SuccessScreen.tsx`, replace the "QR placeholder" div with:
```tsx
import { ProductQR } from "@/components/ProductQR";
// ...
<ProductQR productId={productId} size={176} />
```

### 5. Wire scanner into `frontend/app/verify/page.tsx`

Add a "Scan QR" button next to the Verify submit button, plus a modal state.

```tsx
import { QrCode } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";

// inside the component:
const [scanOpen, setScanOpen] = useState(false);

function handleDecoded(text: string) {
  // Accept either a full URL ".../verify?id=N" or a bare numeric ID
  let id = "";
  try {
    const u = new URL(text);
    id = u.searchParams.get("id") ?? "";
  } catch {
    id = text.trim();
  }
  if (!/^\d+$/.test(id)) {
    toast.error("Scanned code is not a valid product ID");
    return;
  }
  setProductId(id);
  runVerify(id);
}
```

In the form JSX, add the scan button before Verify:
```tsx
<Button type="button" variant="secondary" size="lg" icon={<QrCode className="w-4 h-4" />} onClick={() => setScanOpen(true)}>
  Scan QR
</Button>
<Button type="submit" size="lg" loading={loading}>Verify</Button>
```

And render the scanner:
```tsx
<QRScanner open={scanOpen} onClose={() => setScanOpen(false)} onResult={handleDecoded} />
```

Also, on mount, read `?id=` from the URL and auto-verify so links from QR codes work without a scan:
```tsx
import { useSearchParams } from "next/navigation";
// ...
const searchParams = useSearchParams();
useEffect(() => {
  const q = searchParams.get("id");
  if (q && /^\d+$/.test(q)) {
    setProductId(q);
    runVerify(q);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

## Acceptance checks
- [ ] `/track/<id>` shows a scannable QR in the header (desktop only; hidden on narrow mobile to save space).
- [ ] The Add Product success screen shows a real QR code (no more placeholder).
- [ ] The verify page has a "Scan QR" button next to Verify.
- [ ] Opening the scanner defaults to the **Upload image** tab; uploading a PNG of a previously downloaded QR code correctly pre-fills the ID and auto-verifies.
- [ ] Switching to the **Use camera** tab either streams the webcam feed and decodes on detection, or gracefully falls back to the upload tab if camera permission is denied.
- [ ] Visiting `/verify?id=3` directly auto-verifies Product 3 without any user action.

## STOP — request user review
After finishing, post exactly: `Phase 16 complete — requesting review.`
