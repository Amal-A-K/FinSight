import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL_ENV === "production" ? "standalone" : undefined,
  reactStrictMode: true,
  // Updated configuration for Prisma
  serverExternalPackages: ["@prisma/client"],
  webpack: (config) => {
    config.cache = true;
    return config;
  }
};

export default nextConfig;