"use client";

import { useState } from "react";
import { useWallet } from "@/lib/WalletContext";
import { getContract } from "@/lib/contract";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ContactPicker } from "@/components/ContactPicker";
import type { ContactRole } from "@/lib/types";

interface TransferOwnershipModalProps {
  open: boolean;
  onClose: () => void;
  productId: number;
  onSuccess: () => void;
  /** Default role hint for the "save new contact" path, based on current user's role. */
  suggestedRole: ContactRole;
}

export function TransferOwnershipModal({ open, onClose, productId, onSuccess, suggestedRole }: TransferOwnershipModalProps) {
  const toast = useToast();
  const { walletState } = useWallet();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveNew, setSaveNew] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<ContactRole>(suggestedRole);

  async function submit() {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast.error("Enter a valid 0x-prefixed address");
      return;
    }
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.transferOwnership(productId, address);
      await tx.wait();

      // Log event
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain_product_id: productId,
          actor_address: walletState.address,
          action: "Ownership Transferred",
          notes: `Transferred to ${address}`,
        }),
      }).catch(() => {});

      toast.success(`Ownership of #${productId} transferred`);
      if (saveNew && name.trim()) {
        try {
          await fetch("/api/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              owner_wallet: walletState.address,
              contact_address: address,
              name: name.trim(),
              role,
            }),
          });
        } catch {/* non-fatal */}
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Transfer Product #${productId}`}>
      <p className="text-sm text-gray-400 mb-4">Pick a saved contact or enter a new address. The recipient must already have a role on-chain.</p>
      <ContactPicker
        ownerWallet={walletState.address ?? ""}
        value={address}
        onChange={setAddress}
        saveNewAddress={saveNew}
        setSaveNewAddress={setSaveNew}
        newContactName={name}
        setNewContactName={setName}
        newContactRole={role}
        setNewContactRole={setRole}
      />
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={submit} loading={loading}>Transfer</Button>
      </div>
    </Modal>
  );
}
