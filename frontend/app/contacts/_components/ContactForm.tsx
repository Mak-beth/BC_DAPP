"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Contact, ContactRole } from "@/lib/types";

type Mode = "create" | "edit";

interface ContactFormProps {
  mode: Mode;
  ownerWallet: string;
  existing?: Contact;
  onCancel: () => void;
  onSaved: () => void;
}

export function ContactForm({ mode, ownerWallet, existing, onCancel, onSaved }: ContactFormProps) {
  const toast = useToast();
  const [address, setAddress] = useState(existing?.contact_address ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [role, setRole] = useState<ContactRole>(existing?.role ?? "DISTRIBUTOR");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "create" && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast.error("Enter a valid 0x-prefixed address");
      return;
    }
    if (!name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);
    try {
      const url = mode === "create" ? "/api/contacts" : `/api/contacts/${existing!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const body: Record<string, unknown> = { owner_wallet: ownerWallet, name: name.trim(), role, notes };
      if (mode === "create") body.contact_address = address;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      toast.success(mode === "create" ? "Contact added" : "Contact updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-5 space-y-4">
      <h2 className="text-lg font-bold text-white">{mode === "create" ? "New contact" : "Edit contact"}</h2>
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Distribution" />
      </div>
      <div>
        <Label>Wallet address</Label>
        <Input mono value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." disabled={mode === "edit"} />
      </div>
      <div>
        <Label>Role</Label>
        <Select value={role} onChange={(e) => setRole(e.target.value as ContactRole)}>
          <option value="MANUFACTURER">Manufacturer</option>
          <option value="DISTRIBUTOR">Distributor</option>
          <option value="RETAILER">Retailer</option>
        </Select>
      </div>
      <div>
        <Label>Notes (optional)</Label>
        <Textarea value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" loading={loading}>{mode === "create" ? "Add contact" : "Save changes"}</Button>
      </div>
    </form>
  );
}
