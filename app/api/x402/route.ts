import { NextRequest, NextResponse } from "next/server";

// USDC contract on Base mainnet
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// $0.05 in USDC (6 decimals)
const PRICE_USDC_UNITS = "50000";

function baseUrl(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

// Returns a ListDiscoveryResourcesResponse-compatible document.
// This format is what x402scan and x402-aware agents expect.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const payTo =
    process.env.PAYMENT_RECIPIENT_ADDRESS ??
    "0x0000000000000000000000000000000000000000";
  const origin = baseUrl(req);
  const resourceUrl = `${origin}/api/screener/smart-money`;

  const body = {
    resources: [
      {
        resource: resourceUrl,
        type: "http",
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: "base",
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
