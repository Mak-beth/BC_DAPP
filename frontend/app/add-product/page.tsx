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

import { uploadToIPFS } from "@/lib/ipfs";

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
        setStatus("Uploading certification to IPFS...");
        const { cid, fileName } = await uploadToIPFS(certFile);
        setStatus("Anchoring IPFS CID on-chain...");
        const certTx = await contract.addCertificationHash(productId, cid, fileName);
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
