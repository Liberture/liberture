import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: "/root/liberture",
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/engines']
  },
  async redirects() {
    return [
      {
        source: '/knowledge',
        destination: '/directory',
        permanent: true,
      },
      {
        source: '/knowledge/:slug',
        destination: '/articles/:slug',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
