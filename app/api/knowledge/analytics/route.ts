import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/knowledge/analytics
 * 
 * Returns:
 * - Most viewed articles (all time)
 * - Most popular tags
 * - View trends (last 7/30 days)
 * - Pillar distribution
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Most viewed articles
    const topArticles = await prisma.knowledgeArticle.findMany({
      where: {
        viewCount: {
          gt: 0,
        },
      },
      select: {
        id: true,
        title: true,
        pillar: true,
        author: true,
        viewCount: true,
        slug: true,
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
    })

    // Get all tags and count occurrences
    const allArticles = await prisma.knowledgeArticle.findMany({
      select: {
        tags: true,
        viewCount: true,
      },
    })

    const tagStats: Record<string, { count: number; totalViews: number }> = {}

    allArticles.forEach((article) => {
      const tags = article.tags.split(',').map((t) => t.trim()).filter(Boolean)
      tags.forEach((tag) => {
        if (!tagStats[tag]) {
          tagStats[tag] = { count: 0, totalViews: 0 }
        }
        tagStats[tag].count++
        tagStats[tag].totalViews += article.viewCount
      })
    })

    // Sort tags by usage count, then by total views
    const popularTags = Object.entries(tagStats)
      .sort((a, b) => {
        if (b[1].count !== a[1].count) {
          return b[1].count - a[1].count
        }
        return b[1].totalViews - a[1].totalViews
      })
      .slice(0, limit)
      .map(([tag, stats]) => ({
        tag,
        articleCount: stats.count,
        totalViews: stats.totalViews,
      }))

    // Views in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentViews = await prisma.articleView.count({
      where: {
        viewedAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    // Views in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monthlyViews = await prisma.articleView.count({
      where: {
        viewedAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Total views all time
    const totalViews = await prisma.articleView.count()

    // Pillar distribution by views
    const pillarViews = await prisma.knowledgeArticle.groupBy({
      by: ['pillar'],
      _sum: {
        viewCount: true,
      },
      _count: {
        id: true,
      },
    })

    const pillarStats = pillarViews
      .map((item) => ({
        pillar: item.pillar,
        articleCount: item._count.id,
        totalViews: item._sum.viewCount || 0,
        avgViewsPerArticle: Math.round(
          (item._sum.viewCount || 0) / item._count.id
        ),
      }))
      .sort((a, b) => b.totalViews - a.totalViews)

    return NextResponse.json({
      topArticles,
      popularTags,
      viewTrends: {
        last7Days: recentViews,
        last30Days: monthlyViews,
        allTime: totalViews,
      },
      pillarStats,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
