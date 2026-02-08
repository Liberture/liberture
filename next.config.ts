import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: "/root/liberture",
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/engines']
  }
};

export default nextConfig;
