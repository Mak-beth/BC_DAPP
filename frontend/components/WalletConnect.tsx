"use client";

import { useState, useEffect } from "react";
import { connectWallet, shortenAddress } from "@/lib/contract";
import { useWallet } from "@/lib/WalletContext";
import type { UserRole, DbUser } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Wallet } from "lucide-react";

type ModalState = "hidden" | "visible";
type ConnectState = "idle" | "connecting" | "registering" | "done" | "error";

interface RegisterForm {
  companyName: string;
  role: Exclude<UserRole, "NONE">;
}

export default function WalletConnect() {
  const { walletState, setWalletState, disconnect } = useWallet();

  const [connectState, setConnectState] = useState<ConnectState>("idle");
  const [modalState, setModalState] = useState<ModalState>("hidden");
  const [pendingAddress, setPendingAddress] = useState<string>("");
  const toast = useToast();

  const [form, setForm] = useState<RegisterForm>({
    companyName: "",
    role: "MANUFACTURER",
  });

  async function syncWalletAddress(address: string): Promise<void> {
    const res = await fetch(`/api/users?wallet=${address}`);
    
    if (res.status === 200) {
      const body = await res.json();
      const user = body.data as DbUser;
      setWalletState({
        address,
        role: user.role,
        isConnected: true,
      });
      setModalState("hidden");
      setConnectState("done");
      toast.success("Wallet connected successfully!");
    } else if (res.status === 404) {
      setPendingAddress(address);
      setModalState("visible");
      setConnectState("registering");
    } else {
      let errorMessage = "Failed to fetch user";
      try {
        const body = await res.json();
        if (body.error) {
          errorMessage = body.error;
        }
      } catch {
        // Error parsing response
      }
      throw new Error(errorMessage);
    }
  }

  const handleConnect = async () => {
    try {
      setConnectState("connecting");

      const address = await connectWallet();
      await syncWalletAddress(address);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unknown error occurred");
      }
      setConnectState("error");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    type Eip1193Provider = unknown;
    const ethereum = (window as Window & { ethereum?: Eip1193Provider & { on?: Function; removeListener?: Function; request?: Function } }).ethereum;
    if (!ethereum || !ethereum.on) return;

    async function handleAccountsChanged(accounts: string[]): Promise<void> {
      if (!accounts || accounts.length === 0) {
        disconnect();
        setPendingAddress("");
        setModalState("hidden");
        setConnectState("idle");
        return;
      }

      const nextAddress = accounts[0];
      try {
        await syncWalletAddress(nextAddress);
      } catch (err: unknown) {
        if (err instanceof Error) {
          toast.error(err.message);
        } else {
          toast.error("An unknown error occurred");
        }
        setConnectState("error");
      }
    }

    ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDisconnect = () => {
    disconnect();
    setPendingAddress("");
    setModalState("hidden");
    setConnectState("idle");
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;

    try {
      const payload = {
        wallet_address: pendingAddress,
        role: form.role,
        company_name: form.companyName,
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to register user");
      }

      setWalletState({
        address: pendingAddress,
        role: form.role,
        isConnected: true,
      });

      setModalState("hidden");
      setConnectState("done");
      toast.success("User registered successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Registration failed");
      }
    }
  };

  const roleGlow: Record<UserRole, string> = {
    NONE:         "bg-white/5 text-content-muted border border-border-subtle",
    MANUFACTURER: "bg-[color:var(--role-mfr)]/15 text-[color:var(--role-mfr)] border border-[color:var(--role-mfr)]/40 shadow-[0_0_18px_color-mix(in_srgb,var(--role-mfr)_30%,transparent)]",
    DISTRIBUTOR:  "bg-[color:var(--role-dst)]/15 text-[color:var(--role-dst)] border border-[color:var(--role-dst)]/40 shadow-[0_0_18px_color-mix(in_srgb,var(--role-dst)_30%,transparent)]",
    RETAILER:     "bg-[color:var(--role-ret)]/15 text-[color:var(--role-ret)] border border-[color:var(--role-ret)]/40 shadow-[0_0_18px_color-mix(in_srgb,var(--role-ret)_30%,transparent)]",
  };

  if (walletState.isConnected && walletState.address) {
    return (
      <div className="flex items-center gap-3">
        <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${roleGlow[walletState.role]}`}>
          {walletState.role}
        </span>
        <span className="font-mono text-xs text-gray-300 hidden sm:inline">
          {shortenAddress(walletState.address)}
        </span>
        <Button variant="ghost" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button onClick={handleConnect} loading={connectState === "connecting"} size="sm" icon={<Wallet className="w-4 h-4" />}>
          Connect Wallet
        </Button>
      </div>

      <Modal
        open={modalState === "visible"}
        onClose={() => { setModalState("hidden"); setConnectState("idle"); }}
        title="Register User"
      >
        <p className="text-sm text-gray-400 mb-5 font-mono break-all">{pendingAddress}</p>
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <Label>Company Name</Label>
            <Input
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Exclude<UserRole, "NONE"> })
              }
            >
              <option value="MANUFACTURER">Manufacturer</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="RETAILER">Retailer</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setModalState("hidden"); setConnectState("idle"); }}
            >
              Cancel
            </Button>
            <Button type="submit">Register</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
