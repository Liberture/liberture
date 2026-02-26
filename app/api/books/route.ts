import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        author: true,
        pillars: true,
        year: true,
      },
      orderBy: {
        title: "asc",
      },
    })

    return NextResponse.json(books)
  } catch (error) {
    console.error("Error fetching books:", error)
    return NextResponse.json([])
  }
}
