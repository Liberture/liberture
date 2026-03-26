import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

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
