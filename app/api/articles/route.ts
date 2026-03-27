import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, isAdmin } from "@/lib/auth"
import { randomUUID } from "crypto"

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "")
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, pillar, tags, author, readTime, url, content } = body

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    let slug = slugify(title)
    const existing = await prisma.article.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`

    const now = new Date()
    const article = await prisma.article.create({
      data: {
        id: randomUUID(),
        title,
        description,
        pillar: pillar || "mind",
        tags: tags || "",
        author: author || "Liberture",
        readTime: readTime ? parseInt(readTime) : 5,
        url: url || `/articles/${slug}`,
        slug,
        content: content || "",
        publishedAt: now,
        updatedAt: now,
      },
    })

    return NextResponse.json({ articles: [article] })
  } catch (error) {
    console.error("Error creating article:", error)
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 })
  }
}

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
