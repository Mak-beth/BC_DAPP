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
            "flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium border transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
            tab === "upload" ? "bg-indigo-500/20 border-indigo-400/60 text-white" : "bg-white/[0.03] border-border-subtle text-gray-300 hover:text-white"
          )}
        >
          <Upload className="w-4 h-4" /> Upload image
        </button>
        <button
          onClick={() => setTab("camera")}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium border transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
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
