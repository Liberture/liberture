import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
    })

    // Parse tags (comma-separated string to array)
    const parsedArticles = articles.map((article) => ({
      ...article,
      tags: article.tags.split(',').map(tag => tag.trim()),
      type: article.type || 'Article',
      rating: 5, // Default rating for now
      external: true,
    }))

    return NextResponse.json({
      libraryDocuments: parsedArticles,
      tags: [],
      knowledgeVerticals: [],
      knowledgeTypes: [],
      knowledgeCards: [],
      liberture100Books: [],
      influencers: [],
    })
  } catch (error) {
    console.error('Knowledge API error:', error)
    return NextResponse.json({ error: 'Failed to fetch knowledge articles' }, { status: 500 })
  }
}
