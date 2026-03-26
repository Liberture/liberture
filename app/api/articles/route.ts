import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pillar = searchParams.get('pillar')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'publishedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {}

    if (pillar && pillar !== 'all') {
      where.pillar = pillar
    }

    if (tag) {
      where.tags = { contains: tag }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ]
    }

    const articles = await prisma.article.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        pillar: true,
        tags: true,
        author: true,
        readTime: true,
        url: true,
        publishedAt: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    })

    // Parse tags from comma-separated to array
    const parsed = articles.map(a => ({
      ...a,
      tags: a.tags.split(',').map(t => t.trim()).filter(Boolean),
    }))

    return NextResponse.json({ articles: parsed })
  } catch (error) {
    console.error("Error fetching articles:", error)
    return NextResponse.json({ articles: [] })
  }
}
