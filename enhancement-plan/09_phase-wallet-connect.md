# Phase 09 — Wallet Connect UX

## Goal
Upgrade the wallet UI that sits in the top-right of the navbar: animated connect states, a role pill with role-specific glow (indigo/amber/emerald), a network-mismatch warning banner shown when the user is on a chain other than 31337, and a clean disconnect button.

## Files in scope (ALLOWED to create/edit)
- `frontend/components/WalletConnect.tsx`
- `frontend/components/NetworkBanner.tsx` (new — mounted in layout)
- `frontend/app/layout.tsx`

## Files OUT of scope
- Everything else.

## Dependencies
None new.

## Implementation steps

### 1. `frontend/components/NetworkBanner.tsx` (new)
```tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const EXPECTED_CHAIN_ID = "0x7a69"; // 31337

export function NetworkBanner() {
  const [wrongNetwork, setWrongNetwork] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth) return;

    async function check() {
      try {
        const id = await eth.request({ method: "eth_chainId" });
        setWrongNetwork(id && id.toLowerCase() !== EXPECTED_CHAIN_ID);
      } catch {/* no wallet */}
    }
    check();
    eth.on?.("chainChanged", check);
    return () => eth.removeListener?.("chainChanged", check);
  }, []);

  async function switchNetwork() {
    const eth = (window as any).ethereum;
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: EXPECTED_CHAIN_ID,
          chainName: "Hardhat Local",
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: ["http://127.0.0.1:8545"],
          blockExplorerUrls: [],
        }],
      });
    } catch {/* user cancelled */}
  }

  return (
    <AnimatePresence>
      {wrongNetwork && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden bg-amber-500/10 border-b border-amber-500/30"
        >
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 text-sm text-amber-200">
            <AlertTriangle className="w-4 h-4" />
            <span>You are connected to the wrong network. This DApp requires <strong>Hardhat (Chain ID 31337)</strong>.</span>
            <button onClick={switchNetwork} className="ml-auto underline hover:text-white">Switch</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 2. Mount in `frontend/app/layout.tsx`
Inside `<ToastProvider>`, above `<Navbar />`:
```tsx
import { NetworkBanner } from "@/components/NetworkBanner";
// ...
<ToastProvider>
  <NetworkBanner />
  <Navbar />
  <main ...>{children}</main>
</ToastProvider>
```

### 3. Upgrade `frontend/components/WalletConnect.tsx`

Replace the **connected-state** return block with:

```tsx
const roleGlow: Record<UserRole, string> = {
  NONE:         "bg-gray-500/15 text-gray-300 border border-gray-500/30",
  MANUFACTURER: "bg-indigo-500/15 text-indigo-200 border border-indigo-400/40 shadow-[0_0_16px_rgba(99,102,241,0.35)]",
  DISTRIBUTOR:  "bg-amber-500/15 text-amber-200 border border-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.35)]",
  RETAILER:     "bg-emerald-500/15 text-emerald-200 border border-emerald-400/40 shadow-[0_0_16px_rgba(16,185,129,0.35)]",
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
      <Button variant="ghost" size="sm" onClick={handleDisconnect}>Disconnect</Button>
    </div>
  );
}
```

Remove the old `getRoleBadgeColor` helper; `roleGlow` replaces it.

The Connect button already uses `<Button loading={...}>` after Phase 03. Add a subtle Wallet icon:
```tsx
import { Wallet } from "lucide-react";
// ...
<Button onClick={handleConnect} loading={connectState === "connecting"} size="sm" icon={<Wallet className="w-4 h-4" />}>
  Connect Wallet
</Button>
```

## Acceptance checks
- [ ] MANUFACTURER role pill glows indigo; DISTRIBUTOR amber; RETAILER emerald.
- [ ] Switching MetaMask to a non-Hardhat network makes an amber banner slide down at the top of the page with a "Switch" button; clicking it prompts MetaMask to add/switch to chain 31337.
- [ ] Switching back to chain 31337 auto-dismisses the banner.
- [ ] Connect button shows a wallet icon + spinner while connecting.
- [ ] Disconnect button works and resets the UI.

## STOP — request user review
After finishing, post exactly: `Phase 09 complete — requesting review.`
