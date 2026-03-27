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

    const protocol = await prisma.protocol.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        pillar: body.pillar,
        creator: body.creator || null,
        duration: body.duration || null,
        difficulty: body.difficulty,
        steps: body.steps,
        benefits: body.benefits,
        risks: body.risks || null,
        equipment: body.equipment || null,
        references: body.references || null,
        published: body.published ?? undefined,
        updatedAt: new Date(),
      },
    })

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
