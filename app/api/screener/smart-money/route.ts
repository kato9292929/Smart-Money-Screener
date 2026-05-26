import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { x402Server } from "@/lib/x402";
import { fetchSmartMoneyFlows } from "@/lib/nansen";
import { filterAndScore } from "@/lib/screener";

async function handler(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.NANSEN_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "NANSEN_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const { tokens: raw, total_scanned } = await fetchSmartMoneyFlows(apiKey);
    const tokens = filterAndScore(raw);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tokens,
      total_scanned,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("rate limit")) {
      return NextResponse.json(
        { error: "Nansen API rate limit exceeded. Please retry later." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// x402 v2: $0.05 USDC – Base mainnet (eip155:8453) or Solana mainnet
export const GET = withX402(
  handler,
  {
    accepts: [
      {
        scheme: "exact",
        price: "$0.05",
        network: "eip155:8453",
        payTo:
          process.env.WALLET_ADDRESS_BASE ??
          process.env.WALLET_ADDRESS ??
          "0x0000000000000000000000000000000000000000",
      },
      {
        scheme: "exact",
        price: "$0.05",
        network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
        payTo:
          process.env.WALLET_ADDRESS_SOLANA ??
          "4s8XQC2WzRfgH8Xiep7ybnCW11VKRCMwxQF6jknx3VPf",
      },
    ],
    description: "Smart Money Screener – 24h Solana & Base net-flow data",
    mimeType: "application/json",
  },
  x402Server,
);
