import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "pg", "node-cron", "@neondatabase/serverless", "pdf-parse"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.rspnepal.org",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/_proxy/rsp-images/:path*",
        destination: "https://api.rspnepal.org/images/:path*",
      },
    ];
  },
};

export default nextConfig;
