import { hasTranslatedContent, languageAlternates } from "@/lib/seo/translated-routes"
import { profilePath } from "@/lib/directory/profile-path"
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { GUIDES_UPDATED, guideImages, guidesFor, screenshotSrc } from '@/lib/guides';
import { absoluteUrl, protocolImage, standaloneHabitImage } from '@/lib/habits/protocols/images'
import { STANDALONE_HABITS } from '@/lib/habits/protocols/catalog'

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


  // Static routes are built first and never depend on the database, so a DB
  // outage can't drop the homepage and core pages from the sitemap.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1.0, images: [`${baseUrl}${screenshotSrc('en', 'tracker-today')}`, `${baseUrl}${screenshotSrc('en', 'statistics')}`, `${baseUrl}${screenshotSrc('en', 'mobile-today')}`] },
    { url: `${baseUrl}/directory`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/articles`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/pillars`, changeFrequency: 'weekly', priority: 0.9 },
    ...pillarSlugs.map((pillar) => ({
      url: `${baseUrl}/pillars/${pillar}`,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    { url: `${baseUrl}/people`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/organizations`, changeFrequency: 'weekly', priority: 0.9 },
    {
      url: `${baseUrl}/protocols`,
      changeFrequency: 'weekly',
      priority: 1.0,
      // Standalone catalog habits have no page of their own; their pictures belong to the library.
      images: STANDALONE_HABITS.flatMap((h) => {
        const image = standaloneHabitImage(h.slug)
        return image ? [absoluteUrl(baseUrl, image.png)] : []
      }),
    },
    { url: `${baseUrl}/books`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/how-it-works`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/get-started`, lastModified: new Date(GUIDES_UPDATED), changeFrequency: 'monthly', priority: 0.9, images: [`${baseUrl}${screenshotSrc('en', 'tracker-today')}`] },
    { url: `${baseUrl}/guides`, lastModified: new Date(GUIDES_UPDATED), changeFrequency: 'weekly', priority: 0.8 },
    ...guidesFor('en').articles.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: new Date(GUIDES_UPDATED),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      images: guideImages(guide),
    })),
    { url: `${baseUrl}/docs`, changeFrequency: 'monthly', priority: 0.8, images: [`${baseUrl}${screenshotSrc('en', 'tracker-today')}`] },
    { url: `${baseUrl}/docs/chatgpt`, changeFrequency: 'monthly', priority: 0.6, images: [`${baseUrl}${screenshotSrc('en', 'connect-assistant')}`] },
    { url: `${baseUrl}/docs/claude`, changeFrequency: 'monthly', priority: 0.6, images: [`${baseUrl}${screenshotSrc('en', 'connect-assistant')}`] },
    { url: `${baseUrl}/docs/permissions`, changeFrequency: 'monthly', priority: 0.5, images: [`${baseUrl}${screenshotSrc('en', 'assistant-permissions')}`] },
    { url: `${baseUrl}/docs/api`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/support` },
    { url: `${baseUrl}/docs/updates` },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/media-kit`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [articles, people, books, organizations, protocols, content] = await Promise.all([
    safe('articles', () => prisma.article.findMany({ select: { slug: true, updatedAt: true } })),
    safe('people', () => prisma.person.findMany({ select: { slug: true, updatedAt: true, featured: true } })),
    safe('books', () => prisma.book.findMany({ select: { slug: true, updatedAt: true, featured: true } })),
    safe('organizations', () =>
      prisma.organization.findMany({ select: { directoryKind: true, slug: true, updatedAt: true, featured: true } }),
    ),
    safe('protocols', () =>
      prisma.protocol.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true, featured: true },
      }),
    ),
    safe("content", () => prisma.content.findMany({select:{id:true,updatedAt:true}})),
  ]);

  return [
    ...staticEntries.flatMap(entry => {
      const path = new URL(entry.url).pathname
      if (!hasTranslatedContent(path)) return [entry]
      const languages = languageAlternates(path)
      return [{ ...entry, url: languages["x-default"] }, ...(["en", "es"] as const).map(locale => ({
        ...entry,
        url: languages[locale],
        images: entry.images?.map(image => image.replace("/screenshots/en/", `/screenshots/${locale}/`)),
      }))].map(item => ({ ...item, alternates: { languages } }))
    }),
    ...content.map(item => ({url:`${baseUrl}/content/${encodeURIComponent(item.id)}`,lastModified:item.updatedAt})),

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
      url: `${baseUrl}${profilePath(org)}`,
      lastModified: org.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: org.featured ? 0.8 : 0.7,
    })),

    ...protocols.map((protocol) => {
      // Image sitemap entry: the protocol's own picture, so it can show up in image search.
      const picture = protocolImage(protocol.slug)
      return {
        url: `${baseUrl}/protocols/${protocol.slug}`,
        lastModified: protocol.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: protocol.featured ? 0.8 : 0.7,
        ...(picture ? { images: [absoluteUrl(baseUrl, picture.png)] } : {}),
      }
    }),
  ];
}
