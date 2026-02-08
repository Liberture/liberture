import { MetadataRoute } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://liberture.com'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/knowledge`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/people`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/organizations`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/protocols`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // Fetch all dynamic content with slugs
    const [people, organizations, protocols, books] = await Promise.all([
      prisma.person.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.organization.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.protocol.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.book.findMany({ select: { slug: true, updatedAt: true } }),
    ])

    // People pages
    const peopleSitemap: MetadataRoute.Sitemap = people.map((person) => ({
      url: `${baseUrl}/people/${person.slug}`,
      lastModified: person.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    // Organizations pages
    const organizationsSitemap: MetadataRoute.Sitemap = organizations.map((org) => ({
      url: `${baseUrl}/organizations/${org.slug}`,
      lastModified: org.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    // Protocols pages
    const protocolsSitemap: MetadataRoute.Sitemap = protocols.map((protocol) => ({
      url: `${baseUrl}/protocols/${protocol.slug}`,
      lastModified: protocol.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    // Books pages
    const booksSitemap: MetadataRoute.Sitemap = books.map((book) => ({
      url: `${baseUrl}/books/${book.slug}`,
      lastModified: book.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [
      ...staticPages,
      ...peopleSitemap,
      ...organizationsSitemap,
      ...protocolsSitemap,
      ...booksSitemap,
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages only if database query fails
    return staticPages
  } finally {
    await prisma.$disconnect()
  }
}
