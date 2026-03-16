import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "pg", "node-cron", "@neondatabase/serverless"],
};

export default nextConfig;
