import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requestEditContext, withDirectoryEdit } from "@/lib/directory/revisions"
import { getAuthUser, isAdmin } from "@/lib/auth"

function optionalNumber(value: string | number | null | undefined) {
  if (value === undefined) return undefined
  return value === null || value === "" ? null : Number(value)
}

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

    const book = await withDirectoryEdit(prisma, requestEditContext(request, authUser.userId), tx => tx.book.update({
      where: { id },
      data: {
        title: body.title,
        author: body.author,
        description: body.description,
        pillars: body.pillars,
        year: optionalNumber(body.year),
        pages: optionalNumber(body.pages),
        isbn: body.isbn === "" ? null : body.isbn,
        amazonUrl: body.amazonUrl === "" ? null : body.amazonUrl,
        goodreadsUrl: body.goodreadsUrl === "" ? null : body.goodreadsUrl,
        imageUrl: body.imageUrl === "" ? null : body.imageUrl,
        wikipedia: body.wikipedia === "" ? null : body.wikipedia,
        rating: optionalNumber(body.rating),
        updatedAt: new Date(),
      },
    }))

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
