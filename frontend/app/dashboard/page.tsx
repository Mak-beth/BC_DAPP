"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Boxes, Truck, PackageCheck, Coins, Search } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import { getContract, statusIndexToString } from "@/lib/contract";
import type { Product, DbProduct, ContactRole } from "@/lib/types";
import { IssueRecallModal } from "@/components/IssueRecallModal";
import ProductCard from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { StatTile } from "@/components/StatTile";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { EventFeed } from "@/components/EventFeed";

export default function Dashboard() {
  const { walletState } = useWallet();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [recallMap, setRecallMap] = useState<Record<number, boolean>>({});
  const [recallOpen, setRecallOpen] = useState<number | null>(null);
  const [loading, setLoading]   = useState(false);
  const [query, setQuery]       = useState("");

  async function fetchOwnedProducts() {
    if (!walletState.isConnected || !walletState.address) return;
    setLoading(true);
    try {
      const contract = await getContract(false);
      const total = Number(await contract.getTotalProducts());
      if (total === 0) { setProducts([]); return; }
      const ids = Array.from({ length: total }, (_, i) => i + 1);
      const all = await Promise.all(ids.map((id) => contract.getProduct(id)));
      const owned: Product[] = all
        .filter((p) => p.currentOwner.toLowerCase() === walletState.address!.toLowerCase())
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
      const recallResults = await Promise.all(
        owned.map(async (p) => {
          try {
            const r = await contract.getRecall(p.id);
            return [p.id, r.active] as [number, boolean];
          } catch { return [p.id, false] as [number, boolean]; }
        })
      );
      setRecallMap(Object.fromEntries(recallResults));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOwnedProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletState.address, walletState.isConnected]);

  const stats = useMemo(() => ({
    total:      products.length,
    inTransit:  products.filter((p) => p.status === "IN_TRANSIT").length,
    delivered:  products.filter((p) => p.status === "DELIVERED").length,
    sold:       products.filter((p) => p.status === "SOLD").length,
  }), [products]);

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim().toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.batchNumber.toLowerCase().includes(q) ||
      p.origin.toLowerCase().includes(q)
    );
  }, [products, query]);

  if (!walletState.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-3xl font-bold text-gradient mb-3">Dashboard</h1>
        <p className="text-gray-400">Connect your wallet to view products you own.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.header
        className={cn("rounded-2xl surface-glass p-6", 
          walletState.role === "MANUFACTURER" ? "surface-tint-mfr" :
          walletState.role === "DISTRIBUTOR" ? "surface-tint-dst" :
          walletState.role === "RETAILER" ? "surface-tint-ret" : ""
        )}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm text-gray-400">Welcome back</p>
        <h1 className="text-3xl font-bold text-gradient">Your Supply Chain</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Role: <span className="font-semibold text-white">{walletState.role}</span>
          {" · "}
          <span className="font-mono text-gray-500">{walletState.address}</span>
        </p>
      </motion.header>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total"      value={stats.total}     icon={<Boxes className="w-5 h-5" />}        accent="indigo" />
        <StatTile label="In Transit" value={stats.inTransit} icon={<Truck className="w-5 h-5" />}        accent="amber" />
        <StatTile label="Delivered"  value={stats.delivered} icon={<PackageCheck className="w-5 h-5" />} accent="sky" />
        <StatTile label="Sold"       value={stats.sold}      icon={<Coins className="w-5 h-5" />}        accent="emerald" />
      </div>

      {/* Live Chain Events — Part 1 §5.2.1 audit trail */}
      <EventFeed />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search by name, batch, origin…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "No matches" : "No products yet"}
          description={query ? "Try a different search term." : "When you own products on-chain, they'll show up here."}
          action={
            walletState.role === "MANUFACTURER" && !query ? (
              <Link href="/add-product"><Button>Create your first product</Button></Link>
            ) : null
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                name: p.name,
                description: null,
                origin_country: p.origin,
                batch_number: p.batchNumber,
                created_at: new Date(p.createdAt * 1000).toISOString(),
                chain_product_id: p.id,
                creator_wallet: walletState.address ?? null,
              } as unknown as DbProduct}
              status={p.status}
              canAct={true}
              userRole={walletState.role === "NONE" ? undefined : (walletState.role as ContactRole)}
              onChanged={() => { fetchOwnedProducts(); }}
              isRecalled={!!recallMap[p.id]}
              onRecall={walletState.role === "MANUFACTURER" ? () => setRecallOpen(p.id) : undefined}
            />
          ))}
        </motion.div>
      )}

      {recallOpen !== null && (
        <IssueRecallModal
          productId={recallOpen}
          isRecalled={!!recallMap[recallOpen]}
          open={true}
          onClose={() => setRecallOpen(null)}
          onSuccess={fetchOwnedProducts}
        />
      )}
    </div>
  );
}
