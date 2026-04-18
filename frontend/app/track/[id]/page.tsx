"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getContract, statusIndexToString } from "@/lib/contract";
import { useWallet } from "@/lib/WalletContext";
import type { Product, HistoryEntry, ProductStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

const STATUS_TO_INDEX: Record<ProductStatus, number> = {
  CREATED: 0,
  IN_TRANSIT: 1,
  DELIVERED: 2,
  SOLD: 3,
};

const NEXT_STATUS: Partial<Record<ProductStatus, ProductStatus>> = {
  CREATED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
  DELIVERED: "SOLD",
};

const NEXT_STATUS_LABEL: Partial<Record<ProductStatus, string>> = {
  CREATED: "Mark as In Transit",
  IN_TRANSIT: "Mark as Delivered",
  DELIVERED: "Mark as Sold",
};

export default function TrackProduct() {
  const { id } = useParams() as { id: string };
  const { walletState } = useWallet();

  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [transferTo, setTransferTo] = useState<string>("");
  const [transferLoading, setTransferLoading] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string>("");
  const [transferSuccess, setTransferSuccess] = useState<string>("");

  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string>("");
  const [statusSuccess, setStatusSuccess] = useState<string>("");

  const loadBlockchainData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");

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

      const formatted: HistoryEntry[] = [];
      for (let i = 0; i < h.length; i++) {
        formatted.push({
          actor: h[i].actor,
          action: h[i].action,
          timestamp: Number(h[i].timestamp),
        });
      }
      setHistory(formatted);
    } catch {
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBlockchainData();
  }, [loadBlockchainData]);

  const isOwner =
    !!walletState.address &&
    !!product?.currentOwner &&
    walletState.address.toLowerCase() === product.currentOwner.toLowerCase();

  async function logEvent(action: string, notes: string) {
    if (!walletState.address) return;
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: Number(id),
          actor_address: walletState.address,
          action,
          notes,
        }),
      });
    } catch {
      // event logging is best-effort
    }
  }

  const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const to = transferTo.trim();
    if (!to || !/^0x[0-9a-fA-F]{40}$/.test(to)) {
      setTransferError("Enter a valid Ethereum address (0x...)");
      return;
    }

    setTransferLoading(true);
    setTransferError("");
    setTransferSuccess("");

    try {
      const contract = await getContract(true);
      const tx = await contract.transferOwnership(id, to);
      await tx.wait();

      await logEvent("Ownership Transferred", `Transferred to ${to}`);
      setTransferSuccess(`Ownership transferred to ${to.slice(0, 6)}...${to.slice(-4)}`);
      setTransferTo("");
      await loadBlockchainData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transfer failed";
      setTransferError(msg.includes("reason=") ? msg.split('reason="')[1]?.split('"')[0] ?? msg : msg);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!product) return;
    const next = NEXT_STATUS[product.status];
    if (!next) return;

    setStatusLoading(true);
    setStatusError("");
    setStatusSuccess("");

    try {
      const contract = await getContract(true);
      const tx = await contract.updateStatus(id, STATUS_TO_INDEX[next]);
      await tx.wait();

      await logEvent("Status Updated", `Status changed to ${next}`);
      setStatusSuccess(`Status updated to ${next.replace("_", " ")}`);
      await loadBlockchainData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Status update failed";
      setStatusError(msg.includes("reason=") ? msg.split('reason="')[1]?.split('"')[0] ?? msg : msg);
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-gray-400">Loading product data from blockchain...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex justify-center py-20">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[product.status];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Product Details */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{product.name}</h1>
            <p className="text-sm font-mono text-gray-400">ID: #{product.id}</p>
          </div>
          <StatusBadge status={product.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-700 pt-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Owner</p>
            <p className="text-gray-200 font-mono text-sm break-all">{product.currentOwner}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Origin</p>
            <p className="text-gray-200">{product.origin}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Batch Number</p>
            <p className="text-gray-200">{product.batchNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Created At</p>
            <p className="text-gray-200">{new Date(product.createdAt * 1000).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Owner Actions */}
      {isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Update Status */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">Update Status</h2>
            <p className="text-sm text-gray-400 mb-4">
              Advance this product to the next stage in the supply chain.
            </p>

            {statusSuccess && (
              <div className="bg-green-900/50 border border-green-700 text-green-200 px-3 py-2 rounded-lg text-sm mb-3">
                {statusSuccess}
              </div>
            )}
            {statusError && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm mb-3">
                {statusError}
              </div>
            )}

            {nextStatus ? (
              <button
                onClick={handleUpdateStatus}
                disabled={statusLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-lg transition-colors"
              >
                {statusLoading ? "Updating..." : NEXT_STATUS_LABEL[product.status]}
              </button>
            ) : (
              <p className="text-gray-500 text-sm bg-gray-700/50 px-4 py-3 rounded-lg">
                Product has reached its final status (Sold).
              </p>
            )}
          </div>

          {/* Transfer Ownership */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">Transfer Ownership</h2>
            <p className="text-sm text-gray-400 mb-4">
              Transfer this product to a distributor or retailer address.
            </p>

            {transferSuccess && (
              <div className="bg-green-900/50 border border-green-700 text-green-200 px-3 py-2 rounded-lg text-sm mb-3">
                {transferSuccess}
              </div>
            )}
            {transferError && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm mb-3">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-3">
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="0x... recipient address"
                className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
              <button
                type="submit"
                disabled={transferLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-lg transition-colors"
              >
                {transferLoading ? "Transferring..." : "Transfer Ownership"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Not owner notice */}
      {walletState.isConnected && !isOwner && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-5 py-4 text-sm text-gray-400">
          You are not the current owner of this product. Connect the owner wallet to manage it.
        </div>
      )}

      {/* History Timeline */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">History Timeline</h2>
        {history.length > 0 ? (
          <div className="space-y-6">
            {history.map((entry, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5" />
                  {index !== history.length - 1 && (
                    <div className="w-px h-full bg-gray-600 mt-2" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-white font-medium">{entry.action}</p>
                  <p className="text-sm text-gray-400 font-mono mt-1 mb-1">By: {entry.actor}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(entry.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No history entries found.</p>
        )}
      </div>
    </div>
  );
}
