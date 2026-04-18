"use client";

import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  type Eip1193Provider,
  type InterfaceAbi,
} from "ethers";
import type { ProductStatus } from "./types";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const RPC_URL = "http://127.0.0.1:8545";

type EthereumWindow = Window & { ethereum?: Eip1193Provider };

async function getABI(): Promise<{ abi: InterfaceAbi; contractName?: string }> {
  const artifact = await import("@/public/abi/SupplyChain.json");
  return {
    abi: artifact.abi as InterfaceAbi,
    contractName: artifact.contractName,
  };
}

export async function getContract(withSigner = false): Promise<Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is missing. Check NEXT_PUBLIC_CONTRACT_ADDRESS environment variable.");
  }

  const { abi } = await getABI();

  if (withSigner) {
    if (typeof window === "undefined") {
      throw new Error("Cannot get signer outside of browser environment");
    }

    const ethWindow = window as EthereumWindow;
    if (!ethWindow.ethereum) {
      throw new Error("MetaMask or compatible wallet is required for write access");
    }

    const provider = new BrowserProvider(ethWindow.ethereum);
    const signer = await provider.getSigner();
    return new Contract(CONTRACT_ADDRESS, abi, signer);
  } else {
    const provider = new JsonRpcProvider(RPC_URL);
    return new Contract(CONTRACT_ADDRESS, abi, provider);
  }
}

export async function connectWallet(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Cannot connect wallet outside of browser environment");
  }

  const ethWindow = window as EthereumWindow;
  if (!ethWindow.ethereum) {
    throw new Error("MetaMask or compatible wallet is required");
  }

  const provider = new BrowserProvider(ethWindow.ethereum);
  await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
  const accounts = await provider.send("eth_requestAccounts", []) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found from wallet");
  }

  return accounts[0];
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function statusIndexToString(index: number | bigint): ProductStatus {
  const numIndex = Number(index);
  switch (numIndex) {
    case 0:
      return "CREATED";
    case 1:
      return "IN_TRANSIT";
    case 2:
      return "DELIVERED";
    case 3:
      return "SOLD";
    default:
      throw new Error("Unknown status index");
  }
}
