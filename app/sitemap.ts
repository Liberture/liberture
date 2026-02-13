import { MetadataRoute } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://liberture.com';
  
  try {
    // Fetch all knowledge articles
    const articles = await prisma.knowledgeArticle.findMany({
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
    
    // Fetch all protocols
    const protocols = await prisma.protocol.findMany({
      select: { slug: true, updatedAt: true, featured: true }
    });
    
    await prisma.$disconnect();
    
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
        url: `${baseUrl}/knowledge`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      
      // Pillar pages (hub & spoke model)
      {
        url: `${baseUrl}/pillars/cognition`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/pillars/recovery`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/pillars/fueling`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/pillars/mental`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/pillars/physicality`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/pillars/finance`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
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
      
      // Static pages
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
      
      // Knowledge articles
      ...articles.map((article) => ({
        url: `${baseUrl}/knowledge/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      
      // People
      ...people.map((person) => ({
        url: `${baseUrl}/people/${person.slug}`,
        lastModified: person.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: person.featured ? 0.8 : 0.7,
      })),
      
      // Books
      ...books.map((book) => ({
        url: `${baseUrl}/books/${book.slug}`,
        lastModified: book.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: book.featured ? 0.8 : 0.7,
      })),
      
      // Organizations
      ...organizations.map((org) => ({
        url: `${baseUrl}/organizations/${org.slug}`,
        lastModified: org.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: org.featured ? 0.8 : 0.7,
      })),
      
      // Protocols
      ...protocols.map((protocol) => ({
        url: `${baseUrl}/protocols/${protocol.slug}`,
        lastModified: protocol.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: protocol.featured ? 0.8 : 0.7,
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
