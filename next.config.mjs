const isProduction = process.env.NODE_ENV === 'production'

/**
 * Content-Security-Policy for every response. Next's inline bootstrap scripts
 * need 'unsafe-inline' without per-request nonces (which would make every page
 * dynamic), so this doesn't stop an injected inline script. It does block
 * loading scripts from other origins (Google Tag Manager aside, after cookie
 * consent), plugins, <base> hijacking, form posts elsewhere, and framing.
 * connect-src stays open to https:/wss: for Nostr relays (bunker URIs name
 * any relay) and NIP-05 lookups on any domain.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ...(isProduction ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : []),
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image (Dockerfile sets NEXT_OUTPUT);
  // the liberture.com deploy runs `next start` and needs the regular output.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
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
