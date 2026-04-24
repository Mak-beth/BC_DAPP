"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import type { Contact, ContactRole } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

interface ContactPickerProps {
  ownerWallet: string;
  /** Restrict picker to contacts of these roles (e.g. a manufacturer can only ship to DISTRIBUTOR). */
  allowRoles?: ContactRole[];
  value: string;
  onChange: (address: string) => void;
  /** After a manual address is entered and form submitted, caller may store it. */
  saveNewAddress: boolean;
  setSaveNewAddress: (v: boolean) => void;
  newContactName: string;
  setNewContactName: (v: string) => void;
  newContactRole: ContactRole;
  setNewContactRole: (v: ContactRole) => void;
}

export function ContactPicker({
  ownerWallet,
  allowRoles,
  value,
  onChange,
  saveNewAddress,
  setSaveNewAddress,
  newContactName,
  setNewContactName,
  newContactRole,
  setNewContactRole,
}: ContactPickerProps) {
  const toast = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"pick" | "manual">("pick");

  useEffect(() => {
    if (!ownerWallet) return;
    (async () => {
      try {
        const res = await fetch(`/api/contacts?wallet=${ownerWallet}`);
        const json = await res.json();
        const list = (json.data ?? []) as Contact[];
        setContacts(allowRoles ? list.filter((c) => allowRoles.includes(c.role)) : list);
      } catch {
        toast.error("Could not load contacts");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerWallet]);

  const selected = contacts.find((c) => c.contact_address.toLowerCase() === value.toLowerCase());

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("pick")}
          className={cn(
            "flex-1 h-9 rounded-md text-sm font-medium border transition-colors",
            mode === "pick" ? "bg-violet-500/20 border-violet-400/60 text-white" : "bg-white/[0.03] border-border-subtle text-gray-300"
          )}
        >
          Pick from contacts
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={cn(
            "flex-1 h-9 rounded-md text-sm font-medium border transition-colors",
            mode === "manual" ? "bg-violet-500/20 border-violet-400/60 text-white" : "bg-white/[0.03] border-border-subtle text-gray-300"
          )}
        >
          Enter new address
        </button>
      </div>

      {mode === "pick" ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-border-subtle text-left text-sm flex items-center justify-between"
          >
            {selected ? (
              <span className="truncate">
                <span className="text-white font-medium">{selected.name}</span>
                <span className="text-gray-500 font-mono ml-2">{selected.contact_address.slice(0,6)}…{selected.contact_address.slice(-4)}</span>
              </span>
            ) : (
              <span className="text-gray-500">{contacts.length ? "Choose a saved contact" : "No contacts yet — add one on /contacts"}</span>
            )}
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {open && contacts.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-border-strong bg-bg-raised/95 backdrop-blur-xl shadow-md">
              {contacts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(c.contact_address); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between"
                  >
                    <span>
                      <span className="block text-white">{c.name} <span className="text-xs text-gray-500">· {c.role}</span></span>
                      <span className="block text-xs font-mono text-gray-500">{c.contact_address}</span>
                    </span>
                    {value.toLowerCase() === c.contact_address.toLowerCase() && <Check className="w-4 h-4 text-violet-300" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label>Recipient wallet address</Label>
            <Input
              mono
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={saveNewAddress}
              onChange={(e) => setSaveNewAddress(e.target.checked)}
              className="w-4 h-4 rounded accent-violet-500"
            />
            <Plus className="w-3.5 h-3.5 text-violet-300" />
            Save this address to my contacts
          </label>
          {saveNewAddress && (
            <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-3 space-y-2">
              <div>
                <Label>Contact name</Label>
                <Input value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder="e.g. Acme Distribution" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newContactRole} onChange={(e) => setNewContactRole(e.target.value as ContactRole)}>
                  <option value="MANUFACTURER">Manufacturer</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                  <option value="RETAILER">Retailer</option>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
