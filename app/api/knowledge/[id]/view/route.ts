import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

/**
 * POST /api/knowledge/[id]/view
 * 
 * Track an article view (fire-and-forget from client)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const headersList = await headers()
    const userAgent = headersList.get('user-agent')
    const referrer = headersList.get('referer')

    // Check if article exists
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Create view record
    await prisma.articleView.create({
      data: {
        id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        articleId: id,
        userAgent: userAgent?.slice(0, 255), // Truncate to prevent huge strings
        referrer: referrer?.slice(0, 255),
      },
    })

    // Increment view count (denormalized for performance)
    await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Article View] Error:', error)
    // Don't fail loudly - analytics shouldn't break UX
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
