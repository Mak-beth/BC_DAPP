"use client";

import { useState } from "react";
import { getContract, statusIndexToString } from "@/lib/contract";
import type { DbProduct, ProductStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

interface VerifyData {
  exists: boolean;
  currentOwner: string;
  status: ProductStatus;
  dbProduct: DbProduct | null;
}

export default function VerifyPage() {
  const [productId, setProductId] = useState<string>("");
  const [result, setResult] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const id = productId.trim();
    if (!id || isNaN(Number(id)) || Number(id) <= 0) {
      setError("Please enter a valid product ID (positive number)");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const contract = await getContract(false);

      let exists: boolean;
      let currentOwner: string;
      let statusIndex: bigint | number;

      try {
        [exists, currentOwner, statusIndex] = await contract.verifyProduct(id);
      } catch {
        setError("Product not found on the blockchain.");
        return;
      }

      const status = statusIndexToString(statusIndex);

      let dbProduct: DbProduct | null = null;
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const json = (await res.json()) as { data?: DbProduct };
          dbProduct = json.data ?? null;
        }
      } catch {
        // DB lookup is best-effort; chain data is authoritative
      }

      setResult({ exists, currentOwner, status, dbProduct });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Verify Product</h1>
      <p className="text-gray-400 mb-6 text-sm">
        Enter a product ID to verify its authenticity and current status on the blockchain. No wallet required.
      </p>

      <form
        onSubmit={handleVerify}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6"
      >
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-gray-300 mb-1">
          Product ID
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            min="1"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 flex-1 focus:outline-none focus:border-blue-500"
            placeholder="e.g. 1"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-white">
                {result.dbProduct?.name ?? `Product #${productId}`}
              </h2>
              {result.dbProduct?.batch_number && (
                <p className="text-sm text-gray-400 mt-0.5">
                  Batch: {result.dbProduct.batch_number}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200 border border-green-700">
                Verified on-chain
              </span>
              <StatusBadge status={result.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Current Owner</p>
              <p
                className="text-gray-200 font-mono break-all"
                title={result.currentOwner}
              >
                {result.currentOwner}
              </p>
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

            {result.dbProduct?.created_at && (
              <div>
                <p className="text-gray-500 mb-1">Added to DB</p>
                <p className="text-gray-200">
                  {new Date(result.dbProduct.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-700">
            <a
              href={`/track/${productId}`}
              className="inline-block bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              View Full History →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
