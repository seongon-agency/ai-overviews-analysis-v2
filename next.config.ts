import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output as standalone for Docker/Railway deployment
  output: "standalone",

  // Ensure native modules are handled correctly
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
