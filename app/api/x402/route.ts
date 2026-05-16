import { NextResponse } from "next/server";

// x402 discovery document – consumed by x402scan and compatible clients
export async function GET(): Promise<NextResponse> {
  const discovery = {
    version: "1",
    endpoints: [
      {
        path: "/api/screener/smart-money",
        method: "GET",
        price: "$0.05",
        network: "base",
        asset: "USDC",
        description:
          "Smart Money net-flow screener for Solana & Base (24h window)",
      },
    ],
  };

  return NextResponse.json(discovery, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
