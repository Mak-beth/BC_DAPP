"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { WalletState } from "./types";

interface WalletContextValue {
  walletState: WalletState;
  setWalletState: (state: WalletState) => void;
  disconnect: () => void;
}

const defaultWalletState: WalletState = {
  address: null,
  role: "NONE",
  isConnected: false,
};

export const WalletContext = createContext<WalletContextValue>({
  walletState: defaultWalletState,
  setWalletState: () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>(defaultWalletState);

  const disconnect = useCallback(() => {
    setWalletState(defaultWalletState);
  }, []);

  return (
    <WalletContext.Provider value={{ walletState, setWalletState, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  return useContext(WalletContext);
}
