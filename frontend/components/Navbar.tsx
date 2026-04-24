"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Menu, X } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import WalletConnect from "./WalletConnect";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const links = [
  { href: "/dashboard",     label: "Dashboard",     role: "any" as const },
  { href: "/add-product",   label: "Add Product",   role: "MANUFACTURER" as const },
  { href: "/verify",        label: "Verify",        role: "any" as const },
  { href: "/contacts",      label: "Contacts",      role: "any" as const },
  { href: "/audit",         label: "Audit",         role: "any" as const },
  { href: "/iot-simulator", label: "IoT Simulator", role: "requires_role" as const },
];

export default function Navbar() {
  const pathname = usePathname();
  const { walletState } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = links.filter((l) => {
    if (l.role === "any") return true;
    if (l.role === "requires_role") return walletState.isConnected && walletState.role !== "NONE";
    return walletState.role === l.role;
  });

  return (
    <nav className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base/60 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo + desktop links */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-sig shadow-sig">
              <Link2 className="w-4 h-4 text-white" />
            </span>
            <span className="text-gradient text-lg font-bold tracking-tight">
              SupplyChain DApp
            </span>
          </Link>
          <ul className="hidden md:flex items-center gap-1 relative">
            {visibleLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className="relative px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-md bg-[color:var(--sig-1)]/15 border border-[color:var(--sig-1)]/40 shadow-sig-sm"
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                      />
                    )}
                    <span className={`relative ${active ? "text-white" : ""}`}>
                      {link.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <ThemeSwitcher />
            <WalletConnect />
          </div>
          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden grid place-items-center w-9 h-9 rounded-md border border-border-subtle text-gray-300 hover:text-white hover:border-border-strong"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-border-subtle bg-bg-base/80 backdrop-blur-xl"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {visibleLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base ${
                      active
                        ? "bg-indigo-500/20 text-white border border-indigo-400/40"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-border-subtle mt-2 sm:hidden">
                <WalletConnect />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
