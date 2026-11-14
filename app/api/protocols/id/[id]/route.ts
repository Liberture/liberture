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
      const allowed = ['name', 'description', 'why', 'duration', 'steps', 'benefits', 'risks', 'equipment', 'references']
      const translated = Object.fromEntries(allowed.filter(key => typeof body[key] === "string").map(key => [key, body[key]]))
      Object.assign(translated, media)
      const record = await withDirectoryEdit(prisma, requestEditContext(request, authUser.userId), async tx => {
        await tx.$queryRaw`SELECT id FROM "Protocol" WHERE id=${id} FOR UPDATE`
        const existing = await tx.protocol.findUniqueOrThrow({ where: { id } })
        const localized = (existing.localized ?? {}) as Record<string, Record<string, string>>
        return tx.protocol.update({ where: { id }, data: { localized: { ...localized, es: { ...localized.es, ...translated } }, updatedAt: new Date() } })
      })
      return NextResponse.json(record)
    }

    const protocol = await withDirectoryEdit(prisma, requestEditContext(request, authUser.userId), tx => tx.protocol.update({
      where: { id },
      data: {
        ...media,
        name: body.name,
        description: body.description,
        why: body.why === "" ? null : body.why,
        pillar: body.pillar,
        creator: body.creator === "" ? null : body.creator,
        duration: body.duration === "" ? null : body.duration,
        difficulty: body.difficulty,
        steps: body.steps,
        benefits: body.benefits,
        risks: body.risks === "" ? null : body.risks,
        equipment: body.equipment === "" ? null : body.equipment,
        references: body.references === "" ? null : body.references,
        published: body.published ?? undefined,
        updatedAt: new Date(),
      },
    }))

    return NextResponse.json(protocol)
  } catch (error) {
    console.error("Error updating protocol:", error)
    return NextResponse.json({ error: "Failed to update protocol" }, { status: 500 })
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

    await prisma.protocol.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting protocol:", error)
    return NextResponse.json({ error: "Failed to delete protocol" }, { status: 500 })
  }
}
