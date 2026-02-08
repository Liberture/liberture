import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pillar = searchParams.get('pillar')
    const tag = searchParams.get('tag')

    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        ...(pillar && pillar !== 'all' ? { pillar } : {}),
        ...(tag ? { tags: { contains: tag } } : {}),
      },
      orderBy: {
        publishedAt: 'desc',
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
