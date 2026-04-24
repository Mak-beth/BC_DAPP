"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getContract } from "@/lib/contract";
import { useToast } from "@/components/ui/Toast";

interface Props {
  productId: number;
  isRecalled: boolean;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function IssueRecallModal({ productId, isRecalled, open, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const contract = await getContract(true);
      let tx;
      if (isRecalled) {
        tx = await contract.liftRecall(productId);
      } else {
        if (!reason.trim()) { toast.error("Recall reason is required."); setBusy(false); return; }
        tx = await contract.issueRecall(productId, reason.trim());
      }
      await tx.wait();

      // Log event
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain_product_id: productId,
          actor_address: (await (await getContract(true)).runner as any)?.address,
          action: isRecalled ? "Recall Lifted" : "Product Recalled",
          notes: isRecalled ? "Manufacturer cleared the recall status" : `Reason: ${reason.trim()}`,
        }),
      }).catch(() => {});

      toast.success(isRecalled ? "Recall lifted." : "Recall issued on-chain.");
      setReason("");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transaction failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isRecalled ? "Lift Recall" : "Issue Recall"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRecalled ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Remove the active recall for Product #{productId}. This action is recorded permanently on-chain.
          </p>
        ) : (
          <>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Issue a recall for Product #{productId}. The reason is stored permanently on-chain and visible to anyone who verifies this product.
            </p>
            <textarea
              className="w-full rounded-lg border bg-transparent p-3 text-sm resize-none"
              style={{ borderColor: "rgba(255,255,255,0.12)", color: "var(--text-primary)" }}
              rows={3}
              placeholder="Describe the reason for this recall…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={!isRecalled}
            />
          </>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant={isRecalled ? "secondary" : "danger"}
            loading={busy}
          >
            {isRecalled ? "Lift Recall" : "Issue Recall"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
