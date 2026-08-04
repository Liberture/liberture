/** @type {import('next').NextConfig} */
const nextConfig = {
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
