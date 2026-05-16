import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";
import type { Address } from "viem";
import type { FacilitatorConfig } from "x402/types";
import { fetchSmartMoneyFlows } from "@/lib/nansen";
import { filterAndScore } from "@/lib/screener";

const PAYMENT_RECIPIENT = (
  process.env.PAYMENT_RECIPIENT_ADDRESS ?? "0x0000000000000000000000000000000000000000"
) as Address;

// Coinbase CDP facilitator – url must be a fully-qualified URL string
function buildFacilitatorConfig(): FacilitatorConfig | undefined {
  const raw = process.env.X402_FACILITATOR_URL;
  if (!raw) return undefined;
  // Resource requires a `${string}://${string}` template literal type
  const url = raw as `${string}://${string}`;
  return { url };
}

const FACILITATOR_CONFIG = buildFacilitatorConfig();

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

// Wrap with x402 payment gate: $0.05 USDC on Base per query
export const GET = withX402(
  handler,
  PAYMENT_RECIPIENT,
  {
    price: "$0.05",
    network: "base",
    config: {
      description: "Smart Money Screener – 24h Solana & Base net-flow data",
    },
  },
  FACILITATOR_CONFIG
);
