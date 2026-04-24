"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getContract, statusIndexToString } from "@/lib/contract";
import type { ProductStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { useWallet } from "@/lib/WalletContext";
import { TransferOwnershipModal } from "@/components/TransferOwnershipModal";
import { UpdateStatusModal } from "@/components/UpdateStatusModal";
import { Button } from "@/components/ui/Button";
import { StatusProgressBar } from "./_components/StatusProgressBar";
import { HistoryTimeline, type HistoryEntry } from "./_components/HistoryTimeline";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductQR } from "@/components/ProductQR";
import { FileText, ExternalLink } from "lucide-react";
import { gatewayUrl, publicGatewayUrl } from "@/lib/ipfs";


interface ProductView {
  id: number;
  name: string;
  origin: string;
  batchNumber: string;
  currentOwner: string;
  status: ProductStatus;
  createdAt: number;
}

export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const toast = useToast();
  const { walletState } = useWallet();
  const [product, setProduct] = useState<ProductView | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [certification, setCertification] = useState<{ cid: string; fileName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferOpen, setTransferOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const isOwner = walletState.address?.toLowerCase() === product?.currentOwner.toLowerCase();

  async function load() {
    try {
      const contract = await getContract(false);
        const p = await contract.getProduct(id);
        const h = await contract.getHistory(id);
        setProduct({
          id: Number(p.id),
          name: p.name,
          origin: p.origin,
          batchNumber: p.batchNumber,
          currentOwner: p.currentOwner,
          status: statusIndexToString(p.status),
          createdAt: Number(p.createdAt),
        });
        setHistory(
          h.map((e: any) => ({ actor: e.actor, action: e.action, timestamp: Number(e.timestamp) }))
        );
        const certs = await contract.getCertifications(id);
        if (certs && certs.length > 0) {
          setCertification({ cid: certs[0].cid, fileName: certs[0].fileName });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20 md:col-span-2" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
  if (!product) return <p className="text-gray-400">Product not found.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Product #{product.id}</p>
          <h1 className="text-3xl font-bold text-gradient">{product.name}</h1>
          <p className="text-xs text-gray-400 font-mono mt-1">Batch: {product.batchNumber}</p>
        </div>
        <div className="flex items-start gap-4">
          <StatusBadge status={product.status} />
          {isOwner && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setTransferOpen(true)}>Transfer</Button>
              <Button size="sm" variant="secondary" onClick={() => setStatusOpen(true)}>Update status</Button>
            </div>
          )}
          <div className="hidden md:block">
            <ProductQR productId={product.id} size={140} />
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-5">
        <StatusProgressBar current={product.status} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-4">
          <p className="text-gray-500 mb-1">Current Owner</p>
          <p className="text-gray-200 font-mono break-all">{product.currentOwner}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-4">
          <p className="text-gray-500 mb-1">Origin</p>
          <p className="text-gray-200">{product.origin}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-4 md:col-span-2">
          <p className="text-gray-500 mb-1">Created</p>
          <p className="text-gray-200">{new Date(product.createdAt * 1000).toLocaleString()}</p>
        </div>
        {certification && (
          <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-4 md:col-span-2">
            <p className="text-gray-500 mb-2 text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Certification</p>
            <div className="flex flex-wrap gap-2">
              <a href={gatewayUrl(certification.cid)} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200">
                Local gateway <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-gray-600">·</span>
              <a href={publicGatewayUrl(certification.cid)} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 text-sm text-sky-300 hover:text-sky-200">
                Public gateway <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs font-mono text-gray-500 break-all mt-2">{certification.cid}</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-3">History</h2>
        <HistoryTimeline entries={history} />
      </section>

      {isOwner && product && (
        <>
          <TransferOwnershipModal open={transferOpen} onClose={() => setTransferOpen(false)} productId={product.id} suggestedRole="DISTRIBUTOR" onSuccess={() => load()} />
          <UpdateStatusModal open={statusOpen} onClose={() => setStatusOpen(false)} productId={product.id} current={product.status} onSuccess={() => load()} />
        </>
      )}
    </div>
  );
}
