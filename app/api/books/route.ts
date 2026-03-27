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
    const { title, author, description, pillars, imageUrl, year } = body

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    let slug = slugify(title)
    const existing = await prisma.book.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`

    const book = await prisma.book.create({
      data: {
        id: randomUUID(),
        title,
        author: author || "Unknown",
        description,
        pillars: pillars || "mind",
        slug,
        imageUrl: imageUrl || null,
        year: year ? parseInt(year) : null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ books: [book] })
  } catch (error) {
    console.error("Error creating book:", error)
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const list = searchParams.get('list')

    // Liberture 100 filtered view (requires migration to add libertureRank column)
    if (list === 'liberture100') {
      try {
        const books = await prisma.book.findMany({
          where: { libertureRank: { not: null } },
          orderBy: { libertureRank: "asc" },
        })
        return NextResponse.json({ books })
      } catch {
        // Column doesn't exist yet — return empty
        return NextResponse.json({ books: [] })
      }
    }

    const dbBooks = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        author: true,
        pillars: true,
        year: true,
        imageUrl: true,
        wikipedia: true,
        publications: true,
      },
      orderBy: { title: "asc" },
    })

    return NextResponse.json({ books: dbBooks })
  } catch (error) {
    console.error("Error fetching books:", error)
    return NextResponse.json({ books: [] })
  }
}
