import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const headersList = await headers()
    const userAgent = headersList.get('user-agent')
    const referrer = headersList.get('referer')

    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    await prisma.articleView.create({
      data: {
        id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        articleId: id,
        userAgent: userAgent?.slice(0, 255),
        referrer: referrer?.slice(0, 255),
      },
    })

    await prisma.article.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Article View] Error:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
