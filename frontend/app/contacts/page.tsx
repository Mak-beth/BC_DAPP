"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import type { Contact } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/EmptyState";
import { ContactForm } from "./_components/ContactForm";
import { ContactRow } from "./_components/ContactRow";

export default function ContactsPage() {
  const toast = useToast();
  const { walletState } = useWallet();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [creating, setCreating] = useState(false);

  async function refresh() {
    if (!walletState.address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts?wallet=${walletState.address}`);
      const json = await res.json();
      setContacts((json.data ?? []) as Contact[]);
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [walletState.address]);

  if (!walletState.isConnected) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Contacts</h1>
        <p className="text-gray-400 mt-2">Connect your wallet to manage your address book.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Address book</p>
          <h1 className="text-3xl font-bold text-gradient">Contacts</h1>
          <p className="text-gray-400 text-sm mt-1">Save distributors, retailers, and other wallets for one-click transfer.</p>
        </div>
        {!creating && <Button icon={<UserPlus className="w-4 h-4" />} onClick={() => setCreating(true)}>New contact</Button>}
      </header>

      {creating && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <ContactForm
            mode="create"
            ownerWallet={walletState.address!}
            onCancel={() => setCreating(false)}
            onSaved={() => { setCreating(false); refresh(); }}
          />
        </motion.div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : contacts.length === 0 && !creating ? (
        <EmptyState
          title="No contacts yet"
          description="Add your recurring distributors and retailers so next time you transfer a product, it takes one click."
          action={<Button onClick={() => setCreating(true)}>Add your first contact</Button>}
        />
      ) : (
        <div className="rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl divide-y divide-border-subtle">
          {contacts.map((c) => (
            <ContactRow
              key={c.id}
              contact={c}
              editing={editing?.id === c.id}
              onEdit={() => setEditing(c)}
              onCancelEdit={() => setEditing(null)}
              onSaved={() => { setEditing(null); refresh(); }}
              onDeleted={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
