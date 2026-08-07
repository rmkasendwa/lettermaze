import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@lettermaze/contracts", "@lettermaze/game"],
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL;
    if (!apiUrl) throw new Error("INTERNAL_API_URL is required.");
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
