"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/lib/WalletContext";
import WalletConnect from "./WalletConnect";

interface NavLinkProps {
  href: string;
  label: string;
  active: boolean;
}

function NavLink({ href, label, active }: NavLinkProps) {
  const baseClass = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeClass = "bg-blue-600 text-white";
  const inactiveClass = "text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <Link
      href={href}
      className={`${baseClass} ${active ? activeClass : inactiveClass}`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { walletState } = useWallet();

  return (
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center space-x-8">
          <Link
            href="/dashboard"
            className="text-white text-lg font-bold tracking-wide hover:text-blue-400 transition-colors"
          >
            SupplyChain DApp
          </Link>
          <div className="flex space-x-2">
            <NavLink
              href="/dashboard"
              label="Dashboard"
              active={pathname === "/dashboard"}
            />
            {walletState.role === "MANUFACTURER" && (
              <NavLink
                href="/add-product"
                label="Add Product"
                active={pathname === "/add-product"}
              />
            )}
            <NavLink
              href="/verify"
              label="Verify"
              active={pathname === "/verify"}
            />
          </div>
        </div>
        <div className="flex items-center">
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}
