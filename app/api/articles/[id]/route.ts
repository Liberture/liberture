import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Try by slug first, then by id
    let article = await prisma.article.findUnique({ where: { slug: id } })
    if (!article) {
      article = await prisma.article.findUnique({ where: { id } })
    }

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...article,
      tags: article.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
