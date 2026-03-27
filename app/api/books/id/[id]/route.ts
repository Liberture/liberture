import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, isAdmin } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const book = await prisma.book.update({
      where: { id },
      data: {
        title: body.title,
        author: body.author,
        description: body.description,
        pillars: body.pillars,
        year: body.year ? parseInt(body.year) : null,
        pages: body.pages ? parseInt(body.pages) : null,
        isbn: body.isbn || null,
        amazonUrl: body.amazonUrl || null,
        goodreadsUrl: body.goodreadsUrl || null,
        imageUrl: body.imageUrl || null,
        wikipedia: body.wikipedia || null,
        rating: body.rating ? parseFloat(body.rating) : null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(book)
  } catch (error) {
    console.error("Error updating book:", error)
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params

    await prisma.book.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting book:", error)
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 })
  }
}
