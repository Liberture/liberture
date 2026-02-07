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

    // Parse tags JSON
    const parsedArticles = articles.map((article) => ({
      ...article,
      tags: JSON.parse(article.tags),
    }))

    return NextResponse.json({ articles: parsedArticles })
  } catch (error) {
    console.error('Knowledge API error:', error)
    return NextResponse.json({ error: 'Failed to fetch knowledge articles' }, { status: 500 })
  }
}
