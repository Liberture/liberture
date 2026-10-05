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
  '/coming-soon',
];

export default function robots(): MetadataRoute.Robots {
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
