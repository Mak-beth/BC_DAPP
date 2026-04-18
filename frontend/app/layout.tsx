import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Supply Chain DApp — Group 13",
  description: "Blockchain-based tamper-proof product tracking | CT124-3-3-BCD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <WalletProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
