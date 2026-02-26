import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import knowledgeData from '@/data/knowledge.json'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pillar = searchParams.get('pillar')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'publishedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause with search
    const where: any = {}

    if (pillar && pillar !== 'all') {
      where.pillar = pillar
    }

    if (tag) {
      where.tags = { contains: tag }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get articles from database
    let dbArticles: any[] = []
    try {
      dbArticles = await prisma.knowledgeArticle.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
      })
    } catch {
      // DB might not be seeded yet, continue with JSON data
    }

    // Parse tags from DB articles (comma-separated string to array)
    const parsedDbArticles = dbArticles.map((article) => ({
      ...article,
      tags: article.tags.split(',').map((t: string) => t.trim()),
      type: (article as any).type || 'Article',
      rating: 5,
      external: true,
    }))

    // Filter JSON library documents based on search params
    let jsonLibraryDocs = knowledgeData.libraryDocuments || []
    if (pillar && pillar !== 'all') {
      jsonLibraryDocs = jsonLibraryDocs.filter((doc) => doc.pillar === pillar)
    }
    if (tag) {
      jsonLibraryDocs = jsonLibraryDocs.filter((doc) => doc.tags.some((t) => t.includes(tag)))
    }
    if (search) {
      const q = search.toLowerCase()
      jsonLibraryDocs = jsonLibraryDocs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.author.toLowerCase().includes(q) ||
          doc.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Merge: DB articles first, then JSON library documents
    const allLibraryDocuments = [...parsedDbArticles, ...jsonLibraryDocs]

    // Filter books and influencers based on pillar
    let books = knowledgeData.liberture100Books || []
    let influencers = knowledgeData.influencers || []

    if (pillar && pillar !== 'all') {
      books = books.filter((b) => b.pillar === pillar)
      influencers = influencers.filter((inf) => inf.domains.includes(pillar))
    }

    if (search) {
      const q = search.toLowerCase()
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.summary.toLowerCase().includes(q)
      )
      influencers = influencers.filter(
        (inf) =>
          inf.name.toLowerCase().includes(q) ||
          inf.expertise.toLowerCase().includes(q)
      )
    }

    return NextResponse.json({
      libraryDocuments: allLibraryDocuments,
      tags: knowledgeData.tags || [],
      knowledgeVerticals: knowledgeData.knowledgeVerticals || [],
      knowledgeTypes: knowledgeData.knowledgeTypes || [],
      knowledgeCards: knowledgeData.knowledgeCards || [],
      liberture100Books: books,
      influencers: influencers,
    })
  } catch (error) {
    console.error('Knowledge API error:', error)
    return NextResponse.json({ error: 'Failed to fetch knowledge articles' }, { status: 500 })
  }
}
