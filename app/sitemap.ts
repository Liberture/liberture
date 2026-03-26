import { MetadataRoute } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://liberture.com';
  
  try {
    // Fetch all knowledge articles
    const articles = await prisma.article.findMany({
      select: { slug: true, updatedAt: true }
    });
    
    // Fetch all people
    const people = await prisma.person.findMany({
      select: { slug: true, updatedAt: true, featured: true }
    });
    
    // Fetch all books
    const books = await prisma.book.findMany({
      select: { slug: true, updatedAt: true, featured: true }
    });
    
    // Fetch all organizations
    const organizations = await prisma.organization.findMany({
      select: { slug: true, updatedAt: true, featured: true }
    });
    
    // Fetch all published protocols
    const protocols = await prisma.protocol.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, featured: true }
    });
    
    // Fetch all marketplace items
    const marketplaceItems = await prisma.marketplaceItem.findMany({
      select: { slug: true, updatedAt: true }
    });
    
    await prisma.$disconnect();
    
    // Valid pillar slugs (must match VALID_PILLARS in /app/(site)/pillars/[pillar]/page.tsx)
    const pillarSlugs = ['work', 'sleep', 'nutrition', 'mind', 'exercise', 'finance'];
    
    // Build sitemap
    const sitemap: MetadataRoute.Sitemap = [
      // Homepage
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      
      // Main directory pages
      {
        url: `${baseUrl}/directory`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/articles`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      
      // Pillars index page
      {
        url: `${baseUrl}/pillars`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      
      // Individual pillar pages
      ...pillarSlugs.map((pillar) => ({
        url: `${baseUrl}/pillars/${pillar}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      })),
      
      // Directory sub-pages
      {
        url: `${baseUrl}/people`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/organizations`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/protocols`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/books`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      
      // Marketplace
      {
        url: `${baseUrl}/marketplace`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      
      // Games
      {
        url: `${baseUrl}/games`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/games/hydration`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/games/sleep`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      
      // Static pages
      {
        url: `${baseUrl}/how-it-works`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/media-kit`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.4,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      
      // Articles (dynamic)
      ...articles.map((article) => ({
        url: `${baseUrl}/articles/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      
      // People (dynamic)
      ...people.map((person) => ({
        url: `${baseUrl}/people/${person.slug}`,
        lastModified: person.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: person.featured ? 0.8 : 0.7,
      })),
      
      // Books (dynamic)
      ...books.map((book) => ({
        url: `${baseUrl}/books/${book.slug}`,
        lastModified: book.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: book.featured ? 0.8 : 0.7,
      })),
      
      // Organizations (dynamic)
      ...organizations.map((org) => ({
        url: `${baseUrl}/organizations/${org.slug}`,
        lastModified: org.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: org.featured ? 0.8 : 0.7,
      })),
      
      // Protocols (dynamic)
      ...protocols.map((protocol) => ({
        url: `${baseUrl}/protocols/${protocol.slug}`,
        lastModified: protocol.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: protocol.featured ? 0.8 : 0.7,
      })),
      
      // Marketplace items (dynamic) - only if they have detail pages
      ...marketplaceItems.map((item) => ({
        url: `${baseUrl}/marketplace/${item.slug}`,
        lastModified: item.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ];
    
    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return basic sitemap on error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];
  }
}
