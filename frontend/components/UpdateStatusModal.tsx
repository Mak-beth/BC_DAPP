"use client";

import { useState } from "react";
import { getContract } from "@/lib/contract";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { ProductStatus } from "@/lib/types";

const next: Record<ProductStatus, ProductStatus | null> = {
  CREATED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
  DELIVERED: "SOLD",
  SOLD: null,
};
const statusIndex: Record<ProductStatus, number> = {
  CREATED: 0, IN_TRANSIT: 1, DELIVERED: 2, SOLD: 3,
};

interface UpdateStatusModalProps {
  open: boolean;
  onClose: () => void;
  productId: number;
  current: ProductStatus;
  onSuccess: () => void;
}

export function UpdateStatusModal({ open, onClose, productId, current, onSuccess }: UpdateStatusModalProps) {
  const toast = useToast();
  const target = next[current];
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!target) return;
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.updateStatus(productId, statusIndex[target]);
      await tx.wait();
      toast.success(`Status advanced to ${target}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Advance Product #${productId}`}>
      {target ? (
        <>
          <p className="text-sm text-gray-400 mb-5">
            The smart contract advances status one step at a time. Move from <span className="text-white font-semibold">{current}</span> to <span className="text-white font-semibold">{target}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={submit} loading={loading}>Confirm</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-5">This product is already SOLD — the final status. No further advance is possible.</p>
          <div className="flex justify-end"><Button onClick={onClose}>Close</Button></div>
        </>
      )}
    </Modal>
  );
}
