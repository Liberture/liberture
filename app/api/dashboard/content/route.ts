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

// Check if user can create content (admin or collaborator)
async function canCreateContent(userId: string, nostrPubkey: string | null): Promise<boolean> {
  // Admin can always create
  if (await isAdmin(userId)) return true

  // Check if collaborator
  if (!nostrPubkey) return false

  const collaborator = await prisma.collaborator.findFirst({
    where: {
      OR: [
        { pubkeyHex: nostrPubkey },
        { pubkeyHex: nostrPubkey.toLowerCase() },
      ],
    },
  })

  return !!collaborator
}

// POST — Create new content
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get full user data
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, nostrPubkey: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check permissions
    if (!(await canCreateContent(user.id, user.nostrPubkey))) {
      return NextResponse.json(
        { error: "You must be a collaborator to create content" },
        { status: 403 }
      )
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
        
        // Check for duplicate slug
        let slug = baseSlug
        const existing = await prisma.knowledgeArticle.findUnique({ where: { slug } })
        if (existing) {
          slug = `${baseSlug}-${Date.now().toString(36)}`
        }

        result = await prisma.knowledgeArticle.create({
          data: {
            id: randomUUID(),
            title,
            description,
            pillar,
            tags: tagsString,
            author: user.name || "Anonymous",
            authorPubkey: user.nostrPubkey,
            readTime: readTime || 5,
            url: `/knowledge/${slug}`,
            slug,
            content: content || "",
            publishedAt: new Date(),
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
            authorPubkey: user.nostrPubkey,
            published: true,
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
            authorPubkey: user.nostrPubkey,
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
            authorPubkey: user.nostrPubkey,
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
  } catch (error) {
    console.error("Failed to create content:", error)
    return NextResponse.json(
      { error: "Failed to create content" },
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

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { nostrPubkey: true },
    })

    if (!user?.nostrPubkey) {
      return NextResponse.json({ content: [] })
    }

    // Fetch all content types created by this user
    const [articles, protocols, books] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where: { authorPubkey: user.nostrPubkey },
        select: { id: true, title: true, slug: true, pillar: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.protocol.findMany({
        where: { authorPubkey: user.nostrPubkey },
        select: { id: true, name: true, slug: true, pillar: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.book.findMany({
        where: { authorPubkey: user.nostrPubkey },
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
