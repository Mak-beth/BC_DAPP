"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ContactForm } from "./ContactForm";
import type { Contact } from "@/lib/types";

const rolePalette: Record<Contact["role"], string> = {
  MANUFACTURER: "bg-amber-500/15 text-amber-200 border border-amber-500/40",
  DISTRIBUTOR:  "bg-rose-500/15 text-rose-200 border border-rose-500/40",
  RETAILER:     "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
};

interface ContactRowProps {
  contact: Contact;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function ContactRow({ contact, editing, onEdit, onCancelEdit, onSaved, onDeleted }: ContactRowProps) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!confirm(`Delete contact "${contact.name}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}?wallet=${contact.owner_wallet}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Contact deleted");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <div className="p-4">
        <ContactForm mode="edit" ownerWallet={contact.owner_wallet} existing={contact} onCancel={onCancelEdit} onSaved={onSaved} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{contact.name}</span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${rolePalette[contact.role]}`}>{contact.role}</span>
        </div>
        <p className="text-xs font-mono text-gray-400 break-all mt-0.5">{contact.contact_address}</p>
        {contact.notes && <p className="text-xs text-gray-500 mt-1">{contact.notes}</p>}
      </div>
      <Button variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={onEdit}>Edit</Button>
      <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} loading={deleting} onClick={remove}>Delete</Button>
    </div>
  );
}
