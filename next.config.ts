import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for SQLite to work in Vercel deployments
  output: process.env.VERCEL_ENV === "production" ? "standalone" : undefined,
  
  // Enable React Strict Mode for better error detection
  reactStrictMode: true,

  // Configure Prisma for Edge compatibility
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.cache = true;
    }
    return config;
  },
};

export default nextConfig;