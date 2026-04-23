"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getContract, statusIndexToString } from "@/lib/contract";
import type { DbProduct, ProductStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ScannerFrame } from "./_components/ScannerFrame";
import { AuthenticitySeal } from "./_components/AuthenticitySeal";
import { FileText, ExternalLink, QrCode } from "lucide-react";
import { gatewayUrl, publicGatewayUrl } from "@/lib/ipfs";
import { QRScanner } from "@/components/QRScanner";


interface VerifyData {
  exists: boolean;
  currentOwner: string;
  status: ProductStatus;
  dbProduct: DbProduct | null;
  certification: { cid: string; fileName: string } | null;
}

export default function VerifyPage() {
  const toast = useToast();
  const [productId, setProductId] = useState("");
  const [result, setResult] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get("id");
    if (q && /^\d+$/.test(q)) {
      setProductId(q);
      runVerify(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDecoded(text: string) {
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

  async function runVerify(rawId: string) {
    const id = rawId.trim();
    if (!id || isNaN(Number(id)) || Number(id) <= 0) {
      toast.error("Enter a valid product ID (positive number)");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const contract = await getContract(false);
      const [exists, currentOwner, statusIndex] = await contract.verifyProduct(id);
      let dbProduct: DbProduct | null = null;
      let certification = null;
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) dbProduct = (await res.json()).data ?? null;
      } catch {/* off-chain optional */}
      try {
        const certs = await contract.getCertifications(id);
        if (certs && certs.length > 0) {
          certification = { cid: certs[0].cid, fileName: certs[0].fileName };
        }
      } catch {}
      setResult({ exists, currentOwner, status: statusIndexToString(statusIndex), dbProduct, certification });
    } catch {
      toast.error("Product not found on the blockchain.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-gradient">Verify a Product</h1>
        <p className="text-gray-400 text-sm mt-2">
          No wallet required. Enter a product ID to check its authenticity on the blockchain.
        </p>
      </header>

      <ScannerFrame>
        <form
          onSubmit={(e) => { e.preventDefault(); runVerify(productId); }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Input
            type="number"
            min={1}
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Product ID (e.g. 1)"
            className="h-12 text-lg"
          />
          <Button type="button" variant="secondary" size="lg" icon={<QrCode className="w-4 h-4" />} onClick={() => setScanOpen(true)}>
            Scan QR
          </Button>
          <Button type="submit" size="lg" loading={loading}>Verify</Button>
        </form>
      </ScannerFrame>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            className="rounded-2xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-6 space-y-5"
          >
            <AuthenticitySeal />
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">
                {result.dbProduct?.name ?? `Product #${productId}`}
              </h2>
              {result.dbProduct?.batch_number && (
                <p className="text-xs text-gray-400 font-mono mt-1">Batch: {result.dbProduct.batch_number}</p>
              )}
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-200 border border-emerald-500/40">
                  Verified on-chain
                </span>
                <StatusBadge status={result.status} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Current Owner</p>
                <p className="text-gray-200 font-mono break-all">{result.currentOwner}</p>
              </div>
              {result.dbProduct?.origin_country && (
                <div>
                  <p className="text-gray-500 mb-1">Origin Country</p>
                  <p className="text-gray-200">{result.dbProduct.origin_country}</p>
                </div>
              )}
              {result.dbProduct?.description && (
                <div className="md:col-span-2">
                  <p className="text-gray-500 mb-1">Description</p>
                  <p className="text-gray-200">{result.dbProduct.description}</p>
                </div>
              )}
              {result.certification && (
                <div className="md:col-span-2 rounded-lg border border-border-subtle bg-white/[0.03] p-4 mt-2">
                  <p className="text-gray-500 mb-2 text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Certification</p>
                  <div className="flex flex-wrap gap-2">
                    <a href={gatewayUrl(result.certification.cid)} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200">
                      Local gateway <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-gray-600">·</span>
                    <a href={publicGatewayUrl(result.certification.cid)} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 text-sm text-sky-300 hover:text-sky-200">
                      Public gateway <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs font-mono text-gray-500 break-all mt-2">{result.certification.cid}</p>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-border-subtle flex justify-end">
              <Link href={`/track/${productId}`}>
                <Button variant="secondary" size="sm">View Full History →</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QRScanner open={scanOpen} onClose={() => setScanOpen(false)} onResult={handleDecoded} />
    </div>
  );
}
