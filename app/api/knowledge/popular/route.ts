import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/knowledge/popular
 * 
 * Returns popular/trending articles based on:
 * 1. Recent articles (past 60 days get priority)
 * 2. Diversity across pillars (not all from one pillar)
 * 3. Longer read times (indication of depth)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Get articles from the past 90 days
    const recentCutoff = new Date()
    recentCutoff.setDate(recentCutoff.getDate() - 90)

    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        publishedAt: {
          gte: recentCutoff,
        },
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

    // If we don't have enough recent articles, fetch all and take newest
    let popularArticles = articles
    if (articles.length < limit) {
      popularArticles = await prisma.knowledgeArticle.findMany({
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
        take: limit * 2, // Get extras to ensure diversity
      })
    }

    // Ensure diversity across pillars
    const selectedArticles: typeof popularArticles = []
    const pillarCounts: Record<string, number> = {}

    // First pass: one from each pillar
    for (const article of popularArticles) {
      if (!pillarCounts[article.pillar]) {
        selectedArticles.push(article)
        pillarCounts[article.pillar] = 1
      }
      if (selectedArticles.length >= limit) break
    }

    // Second pass: fill remaining slots
    if (selectedArticles.length < limit) {
      for (const article of popularArticles) {
        if (!selectedArticles.find(a => a.id === article.id)) {
          selectedArticles.push(article)
          pillarCounts[article.pillar] = (pillarCounts[article.pillar] || 0) + 1
        }
        if (selectedArticles.length >= limit) break
      }
    }

    // Parse tags
    const result = selectedArticles.map(article => ({
      ...article,
      tags: article.tags.split(',').map(t => t.trim()),
    }))

    return NextResponse.json({
      popular: result,
      count: result.length,
      algorithm: 'recent + diversity + depth',
    })
  } catch (error) {
    console.error('[Popular Articles] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular articles' },
      { status: 500 }
    )
  }
}
