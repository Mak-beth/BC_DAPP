# Phase 21 — Contacts (address book) + Transfer Ownership / Update Status UI

## Goal
Three things at once, because they are useless without each other:

1. **Contacts** — a persistent address book per wallet. Every role can save recipient wallets with a friendly name (e.g. "Acme Distribution — 0xA1B2…"), edit them, and delete them. Stored in MySQL keyed by the current user's wallet.
2. **Transfer Ownership action** — a "Transfer" button on each product card that opens a modal. The modal has a combobox/picker that lists saved contacts and also allows typing a raw address. A checkbox "Save this address to my contacts for next time" is available when typing a fresh address.
3. **Update Status action** — a "Update Status" button that opens a small modal with the next allowed status (the contract enforces CREATED → IN_TRANSIT → DELIVERED → SOLD one step at a time).

Both actions call the existing Solidity functions `transferOwnership(id, to)` and `updateStatus(id, newStatus)`. No contract changes.

## Files in scope (ALLOWED to create/edit)

**Database**
- `documentation/documentation_group13.md` — append a new `contacts` table to the SQL setup block.

**Types**
- `frontend/lib/types.ts` — add `Contact` interface.

**API**
- `frontend/app/api/contacts/route.ts` (new) — GET by wallet, POST create.
- `frontend/app/api/contacts/[id]/route.ts` (new) — PATCH, DELETE.

**Contacts page**
- `frontend/app/contacts/page.tsx` (new)
- `frontend/app/contacts/_components/ContactForm.tsx` (new)
- `frontend/app/contacts/_components/ContactRow.tsx` (new)

**Action modals (reused from dashboard + track)**
- `frontend/components/TransferOwnershipModal.tsx` (new)
- `frontend/components/UpdateStatusModal.tsx` (new)
- `frontend/components/ContactPicker.tsx` (new — combobox shared by other features later)

**Wire-up**
- `frontend/components/ProductCard.tsx` — add Transfer + Update Status buttons (visible only to the current on-chain owner).
- `frontend/app/dashboard/page.tsx` — pass the current owner context and a `refresh()` to ProductCard.
- `frontend/components/Navbar.tsx` — add "Contacts" nav link (visible to any connected wallet).
- `frontend/app/track/[id]/page.tsx` — add Transfer + Update Status buttons in the header when the connected wallet equals the product owner.

## Files OUT of scope
- `hardhat-project/**` — contract is unchanged.
- `/api/certifications` (Phase 15).
- `/api/events` (Phase 13, 17).

## Dependencies
No new npm packages.

## Implementation steps

### 1. Database — extend the SQL block in the docs
Append to the `CREATE TABLE` block in `documentation/documentation_group13.md` Step 3:

```sql
CREATE TABLE IF NOT EXISTS contacts (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  owner_wallet VARCHAR(42) NOT NULL,
  contact_address VARCHAR(42) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('MANUFACTURER','DISTRIBUTOR','RETAILER') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_owner_contact (owner_wallet, contact_address),
  INDEX idx_owner (owner_wallet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

The docs phase (19) will show this in the setup section automatically if you carry the full SQL block forward.

### 2. `frontend/lib/types.ts` — add `Contact`
```ts
export type ContactRole = "MANUFACTURER" | "DISTRIBUTOR" | "RETAILER";

export interface Contact {
  id: number;
  owner_wallet: string;
  contact_address: string;
  name: string;
  role: ContactRole;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

### 3. API — `frontend/app/api/contacts/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

function isHex(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet || !isHex(wallet)) {
    return NextResponse.json({ error: "wallet query param required" }, { status: 400 });
  }
  const [rows] = await pool.query(
    "SELECT * FROM contacts WHERE owner_wallet = ? ORDER BY name ASC",
    [wallet.toLowerCase()]
  );
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const owner_wallet = String(body.owner_wallet ?? "").toLowerCase();
    const contact_address = String(body.contact_address ?? "").toLowerCase();
    const name = String(body.name ?? "").trim();
    const role = String(body.role ?? "") as "MANUFACTURER" | "DISTRIBUTOR" | "RETAILER";
    const notes = body.notes ? String(body.notes) : null;

    if (!isHex(owner_wallet) || !isHex(contact_address)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }
    if (!name || !["MANUFACTURER","DISTRIBUTOR","RETAILER"].includes(role)) {
      return NextResponse.json({ error: "name and role required" }, { status: 400 });
    }
    if (owner_wallet === contact_address) {
      return NextResponse.json({ error: "Cannot add your own wallet as a contact" }, { status: 400 });
    }

    const [result]: any = await pool.query(
      "INSERT INTO contacts (owner_wallet, contact_address, name, role, notes) VALUES (?,?,?,?,?) " +
      "ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), notes = VALUES(notes)",
      [owner_wallet, contact_address, name, role, notes]
    );
    return NextResponse.json({ data: { id: result.insertId } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
```

### 4. API — `frontend/app/api/contacts/[id]/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json();
  const owner_wallet = String(body.owner_wallet ?? "").toLowerCase();
  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const role = body.role as "MANUFACTURER"|"DISTRIBUTOR"|"RETAILER"|undefined;
  const notes = body.notes !== undefined ? String(body.notes) : undefined;

  const sets: string[] = [];
  const vals: unknown[] = [];
  if (name !== undefined) { sets.push("name = ?"); vals.push(name); }
  if (role !== undefined) { sets.push("role = ?"); vals.push(role); }
  if (notes !== undefined) { sets.push("notes = ?"); vals.push(notes); }
  if (sets.length === 0) return NextResponse.json({ data: { updated: 0 } });
  vals.push(id, owner_wallet);
  const [res]: any = await pool.query(
    `UPDATE contacts SET ${sets.join(", ")} WHERE id = ? AND owner_wallet = ?`,
    vals
  );
  return NextResponse.json({ data: { updated: res.affectedRows } });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  const [res]: any = await pool.query(
    "DELETE FROM contacts WHERE id = ? AND owner_wallet = ?",
    [id, wallet]
  );
  return NextResponse.json({ data: { deleted: res.affectedRows } });
}
```

> If `pool` is not named that in the current `lib/db.ts`, use whatever the existing export is (`getPool()` or `db`). Do not rewrite `lib/db.ts`.

### 5. `frontend/components/ContactPicker.tsx` (new — shared combobox)
```tsx
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
```

### 6. `frontend/components/TransferOwnershipModal.tsx`
```tsx
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
```

### 7. `frontend/components/UpdateStatusModal.tsx`
```tsx
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
```

### 8. Contacts page — `frontend/app/contacts/page.tsx`
```tsx
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
```

### 9. `frontend/app/contacts/_components/ContactForm.tsx`
```tsx
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
```

### 10. `frontend/app/contacts/_components/ContactRow.tsx`
```tsx
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
```

### 11. Wire into `frontend/components/Navbar.tsx`
Add `{ href: "/contacts", label: "Contacts", role: "any" as const }` to the `links` array after "Verify". (Not shown to unconnected wallets because the Contacts page already gates on connection.)

### 12. Wire into `frontend/components/ProductCard.tsx`

Extend the props to include the current owner's address and product status + id, and an `onChanged` callback to refresh parent:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, ArrowRightCircle } from "lucide-react";
import type { DbProduct, ProductStatus, ContactRole } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { TransferOwnershipModal } from "@/components/TransferOwnershipModal";
import { UpdateStatusModal } from "@/components/UpdateStatusModal";

interface ProductCardProps {
  product: DbProduct;
  status?: ProductStatus;
  /** If the connected wallet owns this product, show Transfer + Update-Status actions. */
  canAct?: boolean;
  /** Role of the current wallet — drives which role is pre-selected when saving a new contact. */
  userRole?: ContactRole;
  onChanged?: () => void;
}

export default function ProductCard({ product, status, canAct, userRole, onChanged }: ProductCardProps) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const suggestedRole: ContactRole =
    userRole === "MANUFACTURER" ? "DISTRIBUTOR"
    : userRole === "DISTRIBUTOR" ? "RETAILER"
    : "RETAILER";

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -3, rotate: 0.4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="group relative rounded-xl p-[1px] bg-gradient-to-br from-white/10 to-white/5 hover:from-violet-400/60 hover:to-cyan-400/40 transition-colors"
    >
      <div className="h-full rounded-[11px] bg-bg-raised/90 backdrop-blur-xl border border-border-subtle p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-lg font-bold text-white leading-tight">{product.name}</h2>
          {status && <StatusBadge status={status} />}
        </div>
        <div className="space-y-1 text-sm text-gray-400 flex-1">
          <p><span className="text-gray-500">Batch:</span> <span className="font-mono text-gray-300">{product.batch_number || "N/A"}</span></p>
          <p><span className="text-gray-500">Origin:</span> {product.origin_country || "N/A"}</p>
          <p><span className="text-gray-500">Created:</span> {new Date(product.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/track/${product.chain_product_id}`} className="flex-1">
            <Button size="sm" variant="secondary" className="w-full">Track</Button>
          </Link>
          {canAct && (
            <>
              <Button size="sm" icon={<Send className="w-4 h-4" />} onClick={() => setTransferOpen(true)}>Transfer</Button>
              <Button size="sm" variant="ghost" icon={<ArrowRightCircle className="w-4 h-4" />} onClick={() => setStatusOpen(true)}>Status</Button>
            </>
          )}
        </div>
      </div>

      {canAct && (
        <>
          <TransferOwnershipModal
            open={transferOpen}
            onClose={() => setTransferOpen(false)}
            productId={Number(product.chain_product_id)}
            suggestedRole={suggestedRole}
            onSuccess={() => { onChanged?.(); }}
          />
          <UpdateStatusModal
            open={statusOpen}
            onClose={() => setStatusOpen(false)}
            productId={Number(product.chain_product_id)}
            current={status ?? "CREATED"}
            onSuccess={() => { onChanged?.(); }}
          />
        </>
      )}
    </motion.div>
  );
}
```

### 13. Update `frontend/app/dashboard/page.tsx`
Where each `<ProductCard>` is rendered, add:
```tsx
<ProductCard
  key={p.id}
  product={{ ... } as DbProduct}
  status={p.status}
  canAct={true}
  userRole={walletState.role === "NONE" ? undefined : walletState.role}
  onChanged={() => { /* trigger re-fetch */ fetchOwnedProducts(); }}
/>
```
Extract the existing `fetchOwnedProducts` logic out of `useEffect` into a callable function so it can be reused for refresh.

### 14. Update `frontend/app/track/[id]/page.tsx`
Add two buttons to the header visible only when the connected wallet's address equals `product.currentOwner`:

```tsx
import { useWallet } from "@/lib/WalletContext";
import { TransferOwnershipModal } from "@/components/TransferOwnershipModal";
import { UpdateStatusModal } from "@/components/UpdateStatusModal";
// ...
const { walletState } = useWallet();
const isOwner = walletState.address?.toLowerCase() === product?.currentOwner.toLowerCase();
const [transferOpen, setTransferOpen] = useState(false);
const [statusOpen, setStatusOpen] = useState(false);
// ...
// in the header, next to StatusBadge:
{isOwner && (
  <div className="flex gap-2">
    <Button size="sm" onClick={() => setTransferOpen(true)}>Transfer</Button>
    <Button size="sm" variant="secondary" onClick={() => setStatusOpen(true)}>Update status</Button>
  </div>
)}
// modals at the bottom of the return:
{isOwner && product && (
  <>
    <TransferOwnershipModal open={transferOpen} onClose={() => setTransferOpen(false)} productId={product.id} suggestedRole="DISTRIBUTOR" onSuccess={() => load()} />
    <UpdateStatusModal open={statusOpen} onClose={() => setStatusOpen(false)} productId={product.id} current={product.status} onSuccess={() => load()} />
  </>
)}
```
Extract the existing `useEffect` fetch body into a named `load()` function so `onSuccess` can re-fetch.

## Acceptance checks
- [ ] A new `contacts` table exists in MySQL (`DESCRIBE contacts;` shows 9 columns).
- [ ] `/contacts` lists your contacts; "New contact" opens a form; submitting creates a row; editing updates; deleting removes.
- [ ] Each dashboard card belonging to the current wallet now shows Track / Transfer / Status buttons.
- [ ] Clicking Transfer opens a modal with a tab picker: "Pick from contacts" and "Enter new address".
- [ ] Selecting a saved contact pre-fills the address; submitting calls `transferOwnership` on-chain and the card disappears from the dashboard after the wallet no longer owns it (refresh fires).
- [ ] Entering a new address with "Save this address to my contacts" checked creates a new contacts row.
- [ ] Clicking Status on an `IN_TRANSIT` product offers to move to `DELIVERED`; confirming calls `updateStatus`.
- [ ] Attempting to update a `SOLD` product explains it's already final and offers only Close.
- [ ] The track page shows the same two buttons but only when the connected wallet is the product's current owner.

## STOP — request user review
After finishing, post exactly: `Phase 21 complete — requesting review.`
