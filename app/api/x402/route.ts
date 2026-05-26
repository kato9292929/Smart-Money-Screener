import { NextRequest, NextResponse } from "next/server";

// USDC on Base mainnet
const USDC_BASE   = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// USDC on Solana mainnet
const USDC_SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
// $0.05 in USDC (6 decimals)
const PRICE_UNITS = "50000";

function baseUrl(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

// Returns a ListDiscoveryResourcesResponse-compatible document (x402 v2).
// Each resource exposes two accepts legs: Base (eip155:8453) + Solana mainnet.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const payToBase =
    process.env.WALLET_ADDRESS_BASE ??
    process.env.WALLET_ADDRESS ??
    "0x0000000000000000000000000000000000000000";
  const payToSolana =
    process.env.WALLET_ADDRESS_SOLANA ??
    "4s8XQC2WzRfgH8Xiep7ybnCW11VKRCMwxQF6jknx3VPf";

  const origin = baseUrl(req);
  const resourceUrl = `${origin}/api/screener/smart-money`;

  const body = {
    resources: [
      {
        resource: resourceUrl,
        type: "http",
        x402Version: 2,
        accepts: [
          {
            scheme: "exact",
            network: "eip155:8453",
            maxAmountRequired: PRICE_UNITS,
            resource: resourceUrl,
            description:
              "Smart Money net-flow screener for Solana & Base (24h window)",
            mimeType: "application/json",
            payTo: payToBase,
            maxTimeoutSeconds: 300,
            asset: USDC_BASE,
            extra: { name: "USDC", version: "2" },
          },
          {
            scheme: "exact",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            maxAmountRequired: PRICE_UNITS,
            resource: resourceUrl,
            description:
              "Smart Money net-flow screener for Solana & Base (24h window)",
            mimeType: "application/json",
            payTo: payToSolana,
            maxTimeoutSeconds: 300,
            asset: USDC_SOLANA,
            extra: { name: "USDC", version: "1" },
          },
        ],
      },
    ],
  };

  return NextResponse.json(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}
