import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nansen API calls happen server-side only
  serverExternalPackages: [],
};

export default nextConfig;
