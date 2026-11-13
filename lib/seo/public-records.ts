import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { profileBiography } from "@/lib/profile-biography"

export const getPerson = cache(async (slug: string) => {
  const person = await prisma.person.findUnique({
    where: { slug },
    include: {
      Book: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          year: true,
          pages: true,
          rating: true,
          amazonUrl: true,
          imageUrl: true,
          pillars: true,
        },
        orderBy: [
          { featured: 'desc' },
          { year: 'desc' },
        ],
      },
    },
  });

  if (!person) return null

  // Fetch protocols where this person is the creator
  const protocols = await prisma.protocol.findMany({
    where: {
      creator: slug, published: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      pillar: true,
      difficulty: true,
      duration: true,
      featured: true,
    },
    orderBy: {
      featured: 'desc',
    },
  });

  // Add protocols to person object
  const personWithProtocols = {
    ...person,
    bio: profileBiography(person),
    Protocol: protocols,
  };

  return personWithProtocols
})

export const getBook = cache(async (slug: string) => {
  const book = await prisma.book.findUnique({
    where: { slug },
    include: {
      Person: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!book) return null

  return book
})

export const getOrganization = cache(async (slug: string) => {
  const organization = await prisma.organization.findUnique({
    where: { slug }
  });

  if (!organization) return null

  return organization
})

export const getProtocol = cache(async (slug: string) => {
  const protocol = await prisma.protocol.findUnique({
    where: { slug },
    include: {
      relationsFrom: {
        where: { to: { published: true } },
        include: { to: { select: { slug: true, name: true, pillar: true, description: true } } },
      },
      relationsTo: {
        where: { from: { published: true } },
        include: { from: { select: { slug: true, name: true, pillar: true, description: true } } },
      },
    },
  });

  if (!protocol?.published) return null

  const { relationsFrom, relationsTo, ...base } = protocol;
  const related = [
    ...relationsFrom.map((r) => ({ kind: r.kind, note: r.note, protocol: r.to })),
    ...relationsTo.map((r) => ({ kind: r.kind, note: r.note, protocol: r.from })),
  ];

  if (!related.length) {
    const siblings = await prisma.protocol.findMany({
      where: { published: true, pillar: base.pillar, slug: { not: slug } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: 6,
      select: { slug: true, name: true, pillar: true, description: true },
    })
    related.push(...siblings.map(protocol => ({ kind: "pillar", note: "", protocol })))
  }
  return { ...base, related }
})

export const getContent = cache(async (id: string) => {
    const item = await prisma.content.findUnique({
      where: { id },
    })

    if (!item) {
      return null
    }

    // Parse JSON fields
    return {
      ...item,
      author: JSON.parse(item.author),
      tags: JSON.parse(item.tags),
      outcomes: JSON.parse(item.outcomes),
      prerequisites: item.prerequisites ? JSON.parse(item.prerequisites) : [],
      bioScores: JSON.parse(item.bioScores),
      socialLinks: item.socialLinks ? JSON.parse(item.socialLinks) : {},
      updates: item.updates ? JSON.parse(item.updates) : [],
      relatedContent: item.relatedContent ? JSON.parse(item.relatedContent) : [],
    }

})
