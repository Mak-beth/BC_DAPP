"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getContract, statusIndexToString, shortenAddress } from "@/lib/contract";
import type { Product, ProductStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

const STATUS_OPTIONS: { label: string; value: ProductStatus | "" }[] = [
  { label: "All Statuses", value: "" },
  { label: "Created", value: "CREATED" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Sold", value: "SOLD" },
];

export default function AuditDashboard() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [filterName, setFilterName] = useState<string>("");
  const [filterBatch, setFilterBatch] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<ProductStatus | "">("");

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError("");
      try {
        const contract = await getContract(false);
        const total = Number(await contract.getTotalProducts());

        if (total === 0) {
          setAllProducts([]);
          return;
        }

        const ids = Array.from({ length: total }, (_, i) => i + 1);
        const raw = await Promise.all(ids.map((id) => contract.getProduct(id)));

        const products: Product[] = raw.map((p) => ({
          id: Number(p.id),
          name: p.name,
          origin: p.origin,
          batchNumber: p.batchNumber,
          currentOwner: p.currentOwner,
          status: statusIndexToString(p.status),
          createdAt: Number(p.createdAt),
        }));

        setAllProducts(products);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load products from blockchain");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const filtered = allProducts.filter((p) => {
    if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterBatch && !p.batchNumber.toLowerCase().includes(filterBatch.toLowerCase())) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Audit Dashboard</h1>
        <p className="text-sm text-gray-400">
          Read-only view of all products on the blockchain. No wallet required.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 flex-1 min-w-[150px]"
        />
        <input
          type="text"
          placeholder="Search by batch..."
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 flex-1 min-w-[150px]"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ProductStatus | "")}
          className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {(filterName || filterBatch || filterStatus) && (
          <button
            onClick={() => { setFilterName(""); setFilterBatch(""); setFilterStatus(""); }}
            className="text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading all products from blockchain...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 bg-gray-800/50 p-6 rounded-xl border border-gray-700 text-center">
          {allProducts.length === 0 ? "No products have been registered yet." : "No products match the current filters."}
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length} of {allProducts.length} product{allProducts.length !== 1 ? "s" : ""}
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Batch</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Origin</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Current Owner</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-700 hover:bg-gray-800/60 transition-colors ${
                      i % 2 === 0 ? "bg-gray-800/30" : "bg-gray-800/10"
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400 font-mono">#{p.id}</td>
                    <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-300">{p.batchNumber}</td>
                    <td className="px-4 py-3 text-gray-300">{p.origin}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono">{shortenAddress(p.currentOwner)}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(p.createdAt * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/track/${p.id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
