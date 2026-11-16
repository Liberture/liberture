import { headers } from "next/headers"
import { isIndexableHost } from "@/lib/seo/indexing.mjs"
import { MetadataRoute } from 'next';

const baseUrl = 'https://liberture.com';

// Private / non-indexable surfaces. Kept in one place so the generated groups
// stay consistent across every user-agent.
const disallow = [
  '/admin',
  '/api/',
  '/login',
  '/tracker',
  '/oauth/',
  '/mcp',
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!isIndexableHost((await headers()).get("host"))) {
    return { rules: { userAgent: "*", disallow: "/" } }
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      // Aggressive commercial crawlers: same rules, throttled.
      {
        userAgent: ['AhrefsBot', 'SemrushBot'],
        allow: '/',
        disallow,
        crawlDelay: 5,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
