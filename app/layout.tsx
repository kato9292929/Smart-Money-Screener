import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Money Screener | Nansen × x402",
  description:
    "Real-time smart money screening for Solana & Base. $0.05 per query via x402 protocol. No signup. No subscription.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={mono.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
