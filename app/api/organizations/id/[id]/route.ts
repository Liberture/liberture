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

    const org = await prisma.organization.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        pillars: body.pillars,
        type: body.type,
        founded: body.founded || null,
        website: body.website,
        resources: body.resources || null,
        keyPeople: body.keyPeople || null,
        imageUrl: body.imageUrl || null,
        wikipedia: body.wikipedia || null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(org)
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
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

    await prisma.organization.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 })
  }
}
