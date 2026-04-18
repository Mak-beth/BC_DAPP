"use client";

import { useState, useEffect } from "react";
import { connectWallet, shortenAddress } from "@/lib/contract";
import { useWallet } from "@/lib/WalletContext";
import type { UserRole, DbUser } from "@/lib/types";

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
  const [error, setError] = useState<string>("");

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
      setError("");
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
      setError("");

      const address = await connectWallet();
      await syncWalletAddress(address);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
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
        setError("");
        return;
      }

      const nextAddress = accounts[0];
      try {
        await syncWalletAddress(nextAddress);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
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
    setError("");
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;

    try {
      setError("");
      
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed");
      }
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "MANUFACTURER":
        return "bg-blue-900 text-blue-200 border border-blue-700";
      case "DISTRIBUTOR":
        return "bg-amber-900 text-amber-200 border border-amber-700";
      case "RETAILER":
        return "bg-green-900 text-green-200 border border-green-700";
      default:
        return "bg-gray-800 text-gray-300 border border-gray-600";
    }
  };

  if (walletState.isConnected && walletState.address) {
    return (
      <div className="flex items-center space-x-3">
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-md ${getRoleBadgeColor(
            walletState.role
          )}`}
        >
          {walletState.role}
        </span>
        <span className="font-mono text-sm text-gray-300">
          {shortenAddress(walletState.address)}
        </span>
        <button
          onClick={handleDisconnect}
          className="text-sm text-gray-400 hover:text-white hover:underline transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        {error && <span className="text-red-400 text-sm hidden sm:inline-block">{error}</span>}
        <button
          onClick={handleConnect}
          disabled={connectState === "connecting"}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {connectState === "connecting" ? "Connecting..." : "Connect Wallet"}
        </button>
      </div>

      {modalState === "visible" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Register User</h2>
            <p className="text-sm text-gray-400 mb-6 font-mono">
              {pendingAddress}
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as Exclude<UserRole, "NONE">,
                    })
                  }
                  className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-blue-500"
                >
                  <option value="MANUFACTURER">Manufacturer</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                  <option value="RETAILER">Retailer</option>
                </select>
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalState("hidden");
                    setConnectState("idle");
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
