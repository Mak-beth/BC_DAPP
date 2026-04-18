"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/WalletContext";
import { getContract } from "@/lib/contract";
import type { CreateProductBody } from "@/lib/types";

export default function AddProduct() {
  const router = useRouter();
  const { walletState } = useWallet();

  const [form, setForm] = useState({
    name: "",
    description: "",
    origin_country: "",
    batch_number: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  if (walletState.role !== "MANUFACTURER") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400">Only manufacturers can add products</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!form.name.trim() || !form.origin_country.trim() || !form.batch_number.trim()) {
      setError("Please fill in all required fields (Name, Origin, Batch Number)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const contract = await getContract(true);

      const tx = await contract.addProduct(
        form.name.trim(),
        form.origin_country.trim(),
        form.batch_number.trim()
      );

      const receipt = await tx.wait();

      type ParsedLog = {
        name: string;
        args: {
          id?: bigint;
          0?: bigint;
          [key: string]: unknown;
        };
      };

      const parsedLogs: ParsedLog[] = receipt.logs
        .map((log: unknown) => {
          try {
            return contract.interface.parseLog(
              log as { topics: string[]; data: string }
            ) as unknown as ParsedLog;
          } catch {
            return null;
          }
        })
        .filter((entry: ParsedLog | null): entry is ParsedLog => entry !== null);

      console.log("Parsed logs:", parsedLogs);

      const event = parsedLogs.find((entry) => entry.name === "ProductAdded");

      if (!event) {
        throw new Error("ProductAdded event not found");
      }

      const productIdBigInt = event.args.id ?? event.args[0];

      if (productIdBigInt === undefined) {
        throw new Error("Product ID missing in event");
      }

      const productId = Number(productIdBigInt);

      const apiBody: CreateProductBody = {
        name: form.name.trim(),
        description: form.description.trim(),
        origin_country: form.origin_country.trim(),
        batch_number: form.batch_number.trim(),
        chain_product_id: productId,
        creator_wallet: walletState.address ?? "",
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error || "Failed to save product to database");
      }

      router.push(`/track/${productId}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add product due to an unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Add New Product</h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Product Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-blue-500"
            placeholder="e.g. Premium Coffee Beans"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Origin Country *</label>
          <input
            type="text"
            required
            value={form.origin_country}
            onChange={(e) => setForm({ ...form, origin_country: e.target.value })}
            className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-blue-500"
            placeholder="e.g. Colombia"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Batch Number *</label>
          <input
            type="text"
            required
            value={form.batch_number}
            onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
            className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-blue-500"
            placeholder="e.g. BATCH-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-blue-500 min-h-[100px]"
            placeholder="Optional product description"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-lg transition-colors"
          >
            {loading ? "Adding Product to Blockchain..." : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
