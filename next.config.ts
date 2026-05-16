import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Serve /.well-known/x402.json from the dynamic /api/x402 route
      // so the discovery document is generated at runtime (reads env vars)
      {
        source: "/.well-known/x402.json",
        destination: "/api/x402",
      },
    ];
  },
};

export default nextConfig;
