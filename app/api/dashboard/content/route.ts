import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, isAdmin } from "@/lib/auth"
import { randomUUID } from "crypto"

// Helper to create slug from title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// POST — Create new content (admin only)
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get full user data
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { type, title, description, pillar, tags } = body

    if (!type || !title || !description || !pillar) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, description, pillar" },
        { status: 400 }
      )
    }

    const baseSlug = slugify(title)
    const tagsString = Array.isArray(tags) ? tags.join(", ") : (tags || "")

    let result: any

    switch (type) {
      case "article": {
        const { content, readTime } = body

        let slug = baseSlug
        const existing = await prisma.knowledgeArticle.findUnique({ where: { slug } })
        if (existing) {
          slug = `${baseSlug}-${Date.now().toString(36)}`
        }

        const now = new Date()
        result = await prisma.knowledgeArticle.create({
          data: {
            id: randomUUID(),
            title,
            description,
            pillar,
            tags: tagsString,
            author: user.name || "Anonymous",
            readTime: readTime || 5,
            url: `/knowledge/${slug}`,
            slug,
            content: content || "",
            publishedAt: now,
            updatedAt: now,
          },
        })
        break
      }

      case "protocol": {
        const { difficulty, duration, steps, benefits } = body

        let slug = baseSlug
        const existing = await prisma.protocol.findUnique({ where: { slug } })
        if (existing) {
          slug = `${baseSlug}-${Date.now().toString(36)}`
        }

        result = await prisma.protocol.create({
          data: {
            id: randomUUID(),
            name: title,
            description,
            pillar,
            slug,
            difficulty: difficulty || "beginner",
            duration: duration || "",
            steps: steps || "",
            benefits: benefits || "",
            risks: "",
            published: true,
            updatedAt: new Date(),
          },
        })
        break
      }

      case "book": {
        const { author: bookAuthor, year } = body

        let slug = baseSlug
        const existing = await prisma.book.findUnique({ where: { slug } })
        if (existing) {
          slug = `${baseSlug}-${Date.now().toString(36)}`
        }

        result = await prisma.book.create({
          data: {
            id: randomUUID(),
            title,
            description,
            pillars: pillar,
            slug,
            author: bookAuthor || "Unknown",
            year: year ? parseInt(year) : null,
            updatedAt: new Date(),
          },
        })
        break
      }

      case "person": {
        const { title: personTitle, expertise, website } = body

        let slug = baseSlug
        const existing = await prisma.person.findUnique({ where: { slug } })
        if (existing) {
          slug = `${baseSlug}-${Date.now().toString(36)}`
        }

        result = await prisma.person.create({
          data: {
            id: randomUUID(),
            name: title,
            bio: description,
            pillars: pillar,
            slug,
            title: personTitle || "",
            expertise: expertise || "",
            website: website || "",
            updatedAt: new Date(),
          },
        })
        break
      }

      case "organization": {
        const { orgType, founded, website } = body

        let slug = baseSlug
        const existing = await prisma.organization.findUnique({ where: { slug } })
        if (existing) {
          slug = `${baseSlug}-${Date.now().toString(36)}`
        }

        result = await prisma.organization.create({
          data: {
            id: randomUUID(),
            name: title,
            description,
            pillars: pillar,
            slug,
            type: orgType || "research",
            founded: founded || "",
            website: website || "",
            updatedAt: new Date(),
          },
        })
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown content type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      content: result,
      message: `${type} created successfully`,
    })
  } catch (error: any) {
    console.error("Failed to create content:", error)
    const errorMessage = error?.message || error?.toString() || "Unknown error"
    return NextResponse.json(
      { error: `Failed to create content: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// GET — List user's created content
export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // For now, return recent content across all types
    const [articles, protocols, books] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        select: { id: true, title: true, slug: true, pillar: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.protocol.findMany({
        select: { id: true, name: true, slug: true, pillar: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.book.findMany({
        select: { id: true, title: true, slug: true, pillars: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

    const content = [
      ...articles.map(a => ({ ...a, type: "article", pillar: a.pillar })),
      ...protocols.map(p => ({ ...p, title: p.name, type: "protocol", pillar: p.pillar })),
      ...books.map(b => ({ ...b, type: "book", pillar: b.pillars })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Failed to get content:", error)
    return NextResponse.json(
      { error: "Failed to get content" },
      { status: 500 }
    )
  }
}
