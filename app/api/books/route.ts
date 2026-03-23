import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
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
