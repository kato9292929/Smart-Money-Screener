import { NextRequest, NextResponse } from "next/server";

// USDC contract on Base mainnet
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// $0.05 in USDC (6 decimals)
const PRICE_USDC_UNITS = "50000";
// x402 v2 network identifier (CAIP-2)
const NETWORK = "eip155:8453";

function baseUrl(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

// Returns a ListDiscoveryResourcesResponse-compatible document (x402 v2).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const payTo =
    process.env.WALLET_ADDRESS ??
    "0x0000000000000000000000000000000000000000";
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
            network: NETWORK,
            maxAmountRequired: PRICE_USDC_UNITS,
            resource: resourceUrl,
            description:
              "Smart Money net-flow screener for Solana & Base (24h window)",
            mimeType: "application/json",
            payTo,
            maxTimeoutSeconds: 300,
            asset: USDC_BASE,
            extra: { name: "USDC", version: "2" },
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
