# Phase 10 — Add Product 3-step wizard

## Goal
Turn `/add-product` from a single flat form into a guided 3-step wizard:

1. **Details** — name, origin, batch, description.
2. **Certification** — optional file drop (keep the existing SHA-256 / DB upload path for now; Phase 15 will swap to IPFS).
3. **Review & Submit** — live preview of the product card + confirm button that triggers the on-chain transaction.

After a successful transaction, show a **success screen** with confetti and a QR code placeholder (the QR component itself is built in Phase 16; for now render a styled placeholder card that shows the new product ID and a "Go to track page" button).

## Files in scope (ALLOWED to create/edit)
- `frontend/app/add-product/page.tsx`
- `frontend/app/add-product/_components/Stepper.tsx` (new)
- `frontend/app/add-product/_components/SuccessScreen.tsx` (new)

## Files OUT of scope
- Everything else. Do NOT touch `/api/certifications` or the contract.

## Dependencies
```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

## Implementation steps

### 1. `frontend/app/add-product/_components/Stepper.tsx`
```tsx
"use client";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const steps = ["Details", "Certification", "Review"] as const;

export function Stepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="flex items-center gap-4 mb-8">
      {steps.map((label, i) => {
        const active = i === current;
        const done   = i < current;
        return (
          <li key={label} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "relative grid place-items-center w-8 h-8 rounded-full text-xs font-semibold transition-colors",
              done   && "bg-emerald-500/20 border border-emerald-400/50 text-emerald-200",
              active && "bg-indigo-500/20 border border-indigo-400/60 text-white shadow-glow",
              !done && !active && "bg-white/[0.04] border border-border-subtle text-gray-400"
            )}>
              {done ? <Check className="w-4 h-4" /> : i + 1}
              {active && <motion.span layoutId="step-pulse" className="absolute inset-0 rounded-full ring-2 ring-indigo-400/60" />}
            </div>
            <span className={cn("text-sm", active ? "text-white font-medium" : done ? "text-emerald-300" : "text-gray-500")}>
              {label}
            </span>
            {i < steps.length - 1 && <span className="flex-1 h-px bg-border-subtle" />}
          </li>
        );
      })}
    </ol>
  );
}
```

### 2. `frontend/app/add-product/_components/SuccessScreen.tsx`
```tsx
"use client";
import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

      {/* QR placeholder — Phase 16 replaces this with the real <ProductQR> */}
      <div className="mx-auto w-44 h-44 rounded-xl border border-dashed border-border-strong bg-white/[0.02] grid place-items-center text-gray-500 text-xs">
        QR code<br/>(Phase&nbsp;16)
      </div>

      <div className="flex justify-center gap-3">
        <Link href={`/track/${productId}`}><Button>Go to track page</Button></Link>
        <Link href="/dashboard"><Button variant="secondary">Back to dashboard</Button></Link>
      </div>
    </div>
  );
}
```

### 3. Rewrite `frontend/app/add-product/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/WalletContext";
import { getContract } from "@/lib/contract";
import type { CreateProductBody } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { Stepper } from "./_components/Stepper";
import { SuccessScreen } from "./_components/SuccessScreen";

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return "sha256-" + Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddProduct() {
  const router = useRouter();
  const { walletState } = useWallet();
  const toast = useToast();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [form, setForm] = useState({ name: "", description: "", origin_country: "", batch_number: "" });
  const [certFile, setCertFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState("");
  const [successId, setSuccessId] = useState<number | null>(null);

  if (walletState.role !== "MANUFACTURER") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400">Only manufacturers can add products.</p>
      </div>
    );
  }

  if (successId !== null) return <SuccessScreen productId={successId} />;

  const stepValid = step === 0
    ? form.name.trim() && form.origin_country.trim() && form.batch_number.trim()
    : true;

  async function handleSubmit() {
    setLoading(true);
    setStatus("Adding product to blockchain...");
    try {
      const contract = await getContract(true);
      const tx = await contract.addProduct(form.name.trim(), form.origin_country.trim(), form.batch_number.trim());
      const receipt = await tx.wait();

      const parsed = receipt.logs
        .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .filter(Boolean);
      const event = parsed.find((e: any) => e.name === "ProductAdded");
      if (!event) throw new Error("ProductAdded event not found");
      const productId = Number(event.args.id ?? event.args[0]);

      const apiBody: CreateProductBody = {
        name: form.name.trim(),
        description: form.description.trim(),
        origin_country: form.origin_country.trim(),
        batch_number: form.batch_number.trim(),
        chain_product_id: productId,
        creator_wallet: walletState.address ?? "",
      };
      fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      }).catch(() => {/* non-fatal */});

      if (certFile) {
        setStatus("Anchoring certification...");
        const cid = await computeSHA256(certFile);
        const fileBase64 = await fileToBase64(certFile);
        const uploadRes = await fetch("/api/certifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cid, fileName: certFile.name, fileBase64 }),
        });
        if (!uploadRes.ok) throw new Error("Failed to store certification file");
        const certTx = await contract.addCertificationHash(productId, cid, certFile.name);
        await certTx.wait();
      }

      toast.success(`Product #${productId} added on-chain`);
      setSuccessId(productId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gradient mb-2">Add New Product</h1>
      <p className="text-gray-400 mb-6 text-sm">Three quick steps, then your product lives on-chain.</p>

      <Stepper current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22 }}
          className="rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-6 space-y-5"
        >
          {step === 0 && (
            <>
              <div>
                <Label>Product Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premium Coffee Beans" />
              </div>
              <div>
                <Label>Origin Country *</Label>
                <Input value={form.origin_country} onChange={(e) => setForm({ ...form, origin_country: e.target.value })} placeholder="e.g. Colombia" />
              </div>
              <div>
                <Label>Batch Number *</Label>
                <Input mono value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} placeholder="e.g. BATCH-001" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Label>Certification Document <span className="text-gray-500 font-normal ml-1">(optional)</span></Label>
              <FileDropzone
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                file={certFile}
                onFile={setCertFile}
                hint="SHA-256 will be anchored on-chain (IPFS in Phase 15)"
              />
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Review the details below. You'll be asked to confirm in MetaMask.</p>
              <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-4 space-y-1 text-sm">
                <p><span className="text-gray-500">Name:</span> <span className="text-white font-medium">{form.name}</span></p>
                <p><span className="text-gray-500">Origin:</span> {form.origin_country}</p>
                <p><span className="text-gray-500">Batch:</span> <span className="font-mono">{form.batch_number}</span></p>
                {form.description && <p><span className="text-gray-500">Description:</span> {form.description}</p>}
                {certFile && <p><span className="text-gray-500">Certification:</span> {certFile.name}</p>}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1) as 0 | 1 | 2)} disabled={step === 0 || loading}>
          Back
        </Button>
        {step < 2 ? (
          <Button onClick={() => stepValid && setStep((s) => Math.min(2, s + 1) as 0 | 1 | 2)} disabled={!stepValid}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading}>
            {loading ? (status || "Processing...") : "Confirm & Submit"}
          </Button>
        )}
      </div>
    </div>
  );
}
```

## Acceptance checks
- [ ] `/add-product` now shows a 3-step stepper at the top.
- [ ] Step 1 requires name/origin/batch before "Continue" is enabled.
- [ ] Step 2 shows the file drop-zone; can skip if no file.
- [ ] Step 3 shows a summary of everything entered.
- [ ] After successful on-chain add, confetti fires and the success screen shows the product ID.
- [ ] The success screen has a QR placeholder (the actual QR is rendered in Phase 16).
- [ ] Failed submit shows a toast error, keeps the user on step 3.

## STOP — request user review
After finishing, post exactly: `Phase 10 complete — requesting review.`
