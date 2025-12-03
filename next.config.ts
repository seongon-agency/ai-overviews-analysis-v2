import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure native modules are handled correctly
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
