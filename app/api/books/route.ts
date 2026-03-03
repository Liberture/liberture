import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { fetchBooks } from "@/lib/nostr-reader"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const pillar = request.nextUrl.searchParams.get("pillar") || undefined
  
  try {
    // Try Nostr first
    const nostrBooks = await fetchBooks({ pillar, limit: 100 })
    
    if (nostrBooks.length > 0) {
      const books = nostrBooks.map(b => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        description: b.description,
        author: b.author,
        pillars: b.pillars.join(", "),
        cover: b.cover,
        isbn: b.isbn,
        tags: b.tags,
        source: "nostr",
      }))
      return NextResponse.json({ books })
    }
    
    // Fallback to database
    const dbBooks = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        author: true,
        pillars: true,
        year: true,
      },
      orderBy: { title: "asc" },
    })

    return NextResponse.json({ books: dbBooks.map(b => ({ ...b, source: "database" })) })
  } catch (error) {
    console.error("Error fetching books:", error)
    return NextResponse.json({ books: [] })
  }
}
