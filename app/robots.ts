import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/login',
          '/*.json$',
          '/_next/',
        ],
      },
    ],
    sitemap: 'https://liberture.com/sitemap.xml',
  }
}
