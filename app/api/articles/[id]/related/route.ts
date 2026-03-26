import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    const sourceArticle = await prisma.article.findUnique({
      where: { id },
      select: { id: true, pillar: true, tags: true, title: true },
    })

    if (!sourceArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const sourceTags = sourceArticle.tags.split(',').map(t => t.trim()).filter(Boolean)

    const allArticles = await prisma.article.findMany({
      where: { id: { not: id } },
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

    const scoredArticles = allArticles.map(article => {
      let score = 0
      const articleTags = article.tags.split(',').map(t => t.trim()).filter(Boolean)

      if (article.pillar === sourceArticle.pillar) score += 10

      const sharedTags = articleTags.filter(tag =>
        sourceTags.some(sourceTag => sourceTag.toLowerCase() === tag.toLowerCase())
      )
      score += sharedTags.length * 3

      return {
        ...article,
        tags: articleTags,
        relevanceScore: score,
      }
    })

    const relatedArticles = scoredArticles
      .filter(a => a.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    return NextResponse.json({
      sourceArticle: { id: sourceArticle.id, title: sourceArticle.title },
      related: relatedArticles,
      count: relatedArticles.length,
    })
  } catch (error) {
    console.error('[Related Articles] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch related articles' }, { status: 500 })
  }
}
