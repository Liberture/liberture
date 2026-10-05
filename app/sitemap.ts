import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const baseUrl = 'https://liberture.com';

// Built per request: a build-time render (e.g. in Docker, with no database
// reachable) would freeze the sitemap without any article, person, book,
// organization or protocol URL.
export const dynamic = 'force-dynamic';

// Valid pillar slugs (must match VALID_PILLARS in /app/(site)/pillars/[pillar]/page.tsx)
const pillarSlugs = ['work', 'sleep', 'nutrition', 'mind', 'exercise', 'finance'];

/**
 * Runs a sitemap query, degrading to an empty section if the database is
 * unreachable. Keeps one failing table from emptying the whole sitemap.
 */
async function safe<T>(label: string, query: () => Promise<T[]>): Promise<T[]> {
  try {
    return await query();
  } catch (error) {
    console.error(`sitemap: failed to load ${label}`, error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes are built first and never depend on the database, so a DB
  // outage can't drop the homepage and core pages from the sitemap.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/directory`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/articles`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/pillars`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...pillarSlugs.map((pillar) => ({
      url: `${baseUrl}/pillars/${pillar}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    { url: `${baseUrl}/people`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/organizations`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/protocols`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/books`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/games`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/games/hydration`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/games/sleep`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/docs`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/docs/chatgpt`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/docs/claude`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/docs/permissions`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/docs/api`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/media-kit`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [articles, people, books, organizations, protocols] = await Promise.all([
    safe('articles', () => prisma.article.findMany({ select: { slug: true, updatedAt: true } })),
    safe('people', () => prisma.person.findMany({ select: { slug: true, updatedAt: true, featured: true } })),
    safe('books', () => prisma.book.findMany({ select: { slug: true, updatedAt: true, featured: true } })),
    safe('organizations', () =>
      prisma.organization.findMany({ select: { slug: true, updatedAt: true, featured: true } }),
    ),
    safe('protocols', () =>
      prisma.protocol.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true, featured: true },
      }),
    ),
  ]);

  return [
    ...staticEntries,

    ...articles.map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    ...people.map((person) => ({
      url: `${baseUrl}/people/${person.slug}`,
      lastModified: person.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: person.featured ? 0.8 : 0.7,
    })),

    ...books.map((book) => ({
      url: `${baseUrl}/books/${book.slug}`,
      lastModified: book.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: book.featured ? 0.8 : 0.7,
    })),

    ...organizations.map((org) => ({
      url: `${baseUrl}/organizations/${org.slug}`,
      lastModified: org.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: org.featured ? 0.8 : 0.7,
    })),

    ...protocols.map((protocol) => ({
      url: `${baseUrl}/protocols/${protocol.slug}`,
      lastModified: protocol.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: protocol.featured ? 0.8 : 0.7,
    })),
  ];
}
