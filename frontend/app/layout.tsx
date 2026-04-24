import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletContext";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/Toast";
import { AuroraBackground } from "@/components/AuroraBackground";
import { NetworkBanner } from "@/components/NetworkBanner";
import { RouteProgress } from "@/components/RouteProgress";
import { PageTransition } from "@/components/PageTransition";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Supply Chain DApp — Group 13",
  description: "Blockchain-based tamper-proof product tracking | CT124-3-3-BCD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans bg-bg-base text-content min-h-screen antialiased">
        <ThemeProvider>
          <WalletProvider>
            <ToastProvider>
              <AuroraBackground />
              <NetworkBanner />
              <RouteProgress />
              <Navbar />
              <main className="max-w-6xl mx-auto px-4 py-8">
                <PageTransition>{children}</PageTransition>
              </main>
            </ToastProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
