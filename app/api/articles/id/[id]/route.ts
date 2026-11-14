import { mediaFields } from "@/lib/media/fields"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requestEditContext, withDirectoryEdit } from "@/lib/directory/revisions"
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
    const media = mediaFields(body)
    if (!media) return NextResponse.json({ error: "Invalid media URL" }, { status: 400 })

    if (body.editorLocale === "es") {
      const allowed = ['title', 'description', 'content', 'tags', 'author', 'url']
      const translated = Object.fromEntries(allowed.filter(key => typeof body[key] === "string").map(key => [key, body[key]]))
      Object.assign(translated, media)
      const record = await withDirectoryEdit(prisma, requestEditContext(request, authUser.userId), async tx => {
        await tx.$queryRaw`SELECT id FROM "KnowledgeArticle" WHERE id=${id} FOR UPDATE`
        const existing = await tx.article.findUniqueOrThrow({ where: { id } })
        const localized = (existing.localized ?? {}) as Record<string, Record<string, string>>
        return tx.article.update({ where: { id }, data: { localized: { ...localized, es: { ...localized.es, ...translated } }, updatedAt: new Date() } })
      })
      return NextResponse.json(record)
    }

    const article = await withDirectoryEdit(prisma, requestEditContext(request, authUser.userId), tx => tx.article.update({
      where: { id },
      data: {
        ...media,
        title: body.title,
        description: body.description,
        pillar: body.pillar,
        tags: body.tags,
        author: body.author,
        readTime: body.readTime ? parseInt(body.readTime) : undefined,
        url: body.url,
        content: body.content ?? undefined,
        external: body.external ?? undefined,
        updatedAt: new Date(),
      },
    }))

    return NextResponse.json(article)
  } catch (error) {
    console.error("Error updating article:", error)
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 })
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

    await prisma.article.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting article:", error)
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 })
  }
}
