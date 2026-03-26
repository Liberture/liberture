import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const recentCutoff = new Date()
    recentCutoff.setDate(recentCutoff.getDate() - 90)

    const articles = await prisma.article.findMany({
      where: {
        publishedAt: { gte: recentCutoff },
      },
      select: {
        id: true,
        title: true,
        description: true,
        pillar: true,
        tags: true,
        author: true,
        readTime: true,
        url: true,
        publishedAt: true,
        slug: true,
      },
      orderBy: [
        { publishedAt: 'desc' },
        { readTime: 'desc' },
      ],
    })

    let popularArticles = articles
    if (articles.length < limit) {
      popularArticles = await prisma.article.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          pillar: true,
          tags: true,
          author: true,
          readTime: true,
          url: true,
          publishedAt: true,
          slug: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit * 2,
      })
    }

    // Ensure diversity across pillars
    const selectedArticles: typeof popularArticles = []
    const pillarCounts: Record<string, number> = {}

    for (const article of popularArticles) {
      if (!pillarCounts[article.pillar]) {
        selectedArticles.push(article)
        pillarCounts[article.pillar] = 1
      }
      if (selectedArticles.length >= limit) break
    }

    if (selectedArticles.length < limit) {
      for (const article of popularArticles) {
        if (!selectedArticles.find(a => a.id === article.id)) {
          selectedArticles.push(article)
        }
        if (selectedArticles.length >= limit) break
      }
    }

    const result = selectedArticles.map(article => ({
      ...article,
      tags: article.tags.split(',').map(t => t.trim()),
    }))

    return NextResponse.json({
      popular: result,
      count: result.length,
    })
  } catch (error) {
    console.error('[Popular Articles] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch popular articles' }, { status: 500 })
  }
}
