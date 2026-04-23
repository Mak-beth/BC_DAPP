import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletContext";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ui/Toast";
import { NetworkBanner } from "@/components/NetworkBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Supply Chain DApp — Group 13",
  description: "Blockchain-based tamper-proof product tracking | CT124-3-3-BCD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans bg-bg-base text-gray-100 min-h-screen antialiased">
        <WalletProvider>
          <ToastProvider>
            <NetworkBanner />
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
