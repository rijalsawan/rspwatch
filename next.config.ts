import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "pg", "node-cron", "@neondatabase/serverless", "pdf-parse"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.rspnepal.org",
      },
      {
        protocol: "https",
        hostname: "hr.parliament.gov.np",
      },
      {
        protocol: "https",
        hostname: "na.parliament.gov.np",
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
