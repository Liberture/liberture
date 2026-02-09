import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/knowledge/[id]/related
 * 
 * Find related articles based on:
 * 1. Same pillar (highest priority)
 * 2. Shared tags
 * 3. Similar topics
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    // Get the source article
    const sourceArticle = await prisma.knowledgeArticle.findUnique({
      where: { id },
      select: {
        id: true,
        pillar: true,
        tags: true,
        title: true,
      },
    })

    if (!sourceArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Parse tags
    const sourceTags = sourceArticle.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    // Find related articles with scoring
    const allArticles = await prisma.knowledgeArticle.findMany({
      where: {
        id: { not: id }, // Exclude source article
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
    })

    // Calculate relevance scores
    const scoredArticles = allArticles.map(article => {
      let score = 0
      const articleTags = article.tags.split(',').map(t => t.trim()).filter(Boolean)

      // Same pillar: +10 points
      if (article.pillar === sourceArticle.pillar) {
        score += 10
      }

      // Shared tags: +3 points per tag
      const sharedTags = articleTags.filter(tag => 
        sourceTags.some(sourceTag => 
          sourceTag.toLowerCase() === tag.toLowerCase()
        )
      )
      score += sharedTags.length * 3

      // Partial tag matches: +1 point per partial match
      articleTags.forEach(tag => {
        sourceTags.forEach(sourceTag => {
          if (tag.toLowerCase().includes(sourceTag.toLowerCase()) || 
              sourceTag.toLowerCase().includes(tag.toLowerCase())) {
            score += 1
          }
        })
      })

      return {
        ...article,
        tags: articleTags,
        relevanceScore: score,
      }
    })

    // Sort by score and take top N
    const relatedArticles = scoredArticles
      .filter(a => a.relevanceScore > 0) // Only include if any relevance
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    return NextResponse.json({
      sourceArticle: {
        id: sourceArticle.id,
        title: sourceArticle.title,
      },
      related: relatedArticles,
      count: relatedArticles.length,
    })
  } catch (error) {
    console.error('[Related Articles] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch related articles' },
      { status: 500 }
    )
  }
}
