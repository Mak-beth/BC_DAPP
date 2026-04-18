"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/lib/WalletContext";
import { getContract, statusIndexToString } from "@/lib/contract";
import type { Product } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export default function Dashboard() {
  const { walletState } = useWallet();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchOwnedProducts() {
      if (!walletState.isConnected || !walletState.address) return;

      setLoading(true);
      setError("");

      try {
        const contract = await getContract(false);
        const total = Number(await contract.getTotalProducts());

        if (total === 0) {
          setProducts([]);
          return;
        }

        const ids = Array.from({ length: total }, (_, i) => i + 1);
        const all = await Promise.all(ids.map((id) => contract.getProduct(id)));

        const owned: Product[] = all
          .filter(
            (p) =>
              p.currentOwner.toLowerCase() === walletState.address!.toLowerCase()
          )
          .map((p) => ({
            id: Number(p.id),
            name: p.name,
            origin: p.origin,
            batchNumber: p.batchNumber,
            currentOwner: p.currentOwner,
            status: statusIndexToString(p.status),
            createdAt: Number(p.createdAt),
          }));

        setProducts(owned);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    fetchOwnedProducts();
  }, [walletState.address, walletState.isConnected]);

  if (!walletState.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Dashboard</h1>
        <p className="text-gray-400">Connect your wallet to view products</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Your Products</h1>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading products from blockchain...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-400 bg-gray-800/50 p-6 rounded-xl border border-gray-700 text-center flex flex-col items-center">
          <span className="mb-2">No products currently in your possession.</span>
          {walletState.role === "MANUFACTURER" && (
            <Link href="/add-product" className="text-blue-400 hover:underline text-sm">
              Create your first product
            </Link>
          )}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold text-white leading-tight">{p.name}</h2>
                <StatusBadge status={p.status} />
              </div>

              <div className="space-y-1 text-sm text-gray-400 flex-1">
                <p>
                  <span className="text-gray-500">Batch:</span> {p.batchNumber || "N/A"}
                </p>
                <p>
                  <span className="text-gray-500">Origin:</span> {p.origin || "N/A"}
                </p>
                <p>
                  <span className="text-gray-500">Created:</span>{" "}
                  {new Date(p.createdAt * 1000).toLocaleDateString()}
                </p>
              </div>

              <Link
                href={`/track/${p.id}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors text-center"
              >
                Track Product
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
