import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Money Screener",
  description:
    "Real-time smart money net-flow screener for Solana and Base, powered by Nansen and x402.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
