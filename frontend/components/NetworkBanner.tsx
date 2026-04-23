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
