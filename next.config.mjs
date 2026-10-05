/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image (Dockerfile sets NEXT_OUTPUT);
  // the liberture.com deploy runs `next start` and needs the regular output.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
      // The browser-only tracker and its setup wizard became the server-backed tracker.
      { source: '/dashboard', destination: '/tracker', permanent: false },
      { source: '/dashboard/:path*', destination: '/tracker', permanent: false },
      { source: '/admin-login', destination: '/login?redirect=/admin', permanent: false },
      // The marketplace section became the protocol library.
      {
        source: '/marketplace',
        destination: '/protocols',
        permanent: true,
      },
      {
        source: '/marketplace/:slug',
        destination: '/protocols/:slug',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
